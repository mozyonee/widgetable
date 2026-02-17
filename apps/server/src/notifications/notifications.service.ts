import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { translate } from '@widgetable/i18n';
import {
	CLAIMS_CONFIG,
	DEFAULT_LANGUAGE,
	NOTIFICATION_CONFIG,
	PET_NEED_KEYS,
	PET_NEEDS_CONFIG,
	PET_UPDATE_INTERVAL,
} from '@widgetable/types';
import { clamp } from 'lodash';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { WEBPUSH_CONFIG } from 'src/shared/constants';
import { User, UserDocument } from 'src/users/entities/user.entity';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './entities/push-subscription.entity';

export const nt = (lang: string, key: string, params?: Record<string, string | number>): string => {
	return translate(lang, `notif.${key}`, params);
};

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		@InjectModel(PushSubscription.name) private subscriptionModel: Model<PushSubscriptionDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		private readonly configService: ConfigService,
	) {
		const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
		const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
		const subject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:vadym.abakumov@gmail.com');

		if (publicKey && privateKey) {
			webpush.setVapidDetails(subject, publicKey, privateKey);
		}
	}

	async subscribe(
		userId: Types.ObjectId,
		subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
	) {
		return this.subscriptionModel.findOneAndUpdate(
			{ endpoint: subscription.endpoint },
			{ userId, endpoint: subscription.endpoint, keys: subscription.keys },
			{ upsert: true, new: true },
		);
	}

	async unsubscribe(endpoint: string) {
		return this.subscriptionModel.deleteOne({ endpoint });
	}

	private async getUserLang(userId: string | Types.ObjectId): Promise<string> {
		const user = await this.userModel.findById(userId).select('language').lean();
		return user?.language || DEFAULT_LANGUAGE;
	}

	private async batchGetUserLangs(userIds: string[]): Promise<Map<string, string>> {
		const users = await this.userModel
			.find({ _id: { $in: userIds } })
			.select('_id language')
			.lean();
		const langMap = new Map<string, string>();
		users.forEach((user) => {
			langMap.set(user._id.toString(), user.language || DEFAULT_LANGUAGE);
		});
		userIds.forEach((id) => {
			if (!langMap.has(id)) {
				langMap.set(id, DEFAULT_LANGUAGE);
			}
		});
		return langMap;
	}

	async sendTestNotification(userId: Types.ObjectId) {
		const subscriptions = await this.subscriptionModel.find({ userId });

		if (subscriptions.length === 0) {
			return { sent: 0, message: 'No subscriptions found for this user' };
		}

		const lang = await this.getUserLang(userId);
		const payload = JSON.stringify({
			title: nt(lang, 'test.title'),
			body: nt(lang, 'test.body'),
			icon: '/icon-192x192.png',
			url: '/',
		});

		let sent = 0;
		for (const sub of subscriptions) {
			try {
				await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, payload);
				sent++;
			} catch (error) {
				const err = error as { statusCode?: number; message?: string };
				if (
					err.statusCode &&
					(WEBPUSH_CONFIG.INVALID_SUBSCRIPTION_CODES as readonly number[]).includes(err.statusCode)
				) {
					await this.subscriptionModel.deleteOne({ _id: sub._id });
					this.logger.debug(`Removed expired subscription: ${sub.endpoint}`);
				} else {
					this.logger.error(`Failed to send test notification: ${err.message || 'Unknown error'}`);
				}
			}
		}

		return { sent, total: subscriptions.length };
	}

	async sendNotificationToUser(
		userId: Types.ObjectId,
		payload: { title: string; body: string; icon?: string; url?: string },
	): Promise<void> {
		const subscriptions = await this.subscriptionModel.find({ userId });
		const data = JSON.stringify({
			...payload,
			icon: payload.icon ?? '/icon-192x192.png',
			url: payload.url ?? '/',
		});

		for (const sub of subscriptions) {
			try {
				await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, data);
			} catch (error) {
				const err = error as { statusCode?: number };
				if (
					err.statusCode &&
					(WEBPUSH_CONFIG.INVALID_SUBSCRIPTION_CODES as readonly number[]).includes(err.statusCode)
				) {
					await this.subscriptionModel.deleteOne({ _id: sub._id });
					this.logger.debug(`Removed expired subscription: ${sub.endpoint}`);
				} else {
					this.logger.error(`Failed to send notification: ${error.message}`);
				}
			}
		}
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async checkPetNeeds() {
		this.logger.debug('Checking pet needs for notifications...');

		const pets = await this.petModel.find({ isEgg: false, isOnExpedition: false }).lean();

		const urgentUsers = new Map<string, string[]>();
		const zeroUsers = new Map<string, string[]>();

		for (const pet of pets) {
			const timeDiff = Date.now() - (pet.updatedAt?.getTime() || 0);
			const intervals = Math.floor(timeDiff / PET_UPDATE_INTERVAL);

			if (intervals <= 0) continue;

			let hasNewUrgent = false;
			let allZero = true;

			for (const key of PET_NEED_KEYS) {
				const config = PET_NEEDS_CONFIG[key];
				const decrease =
					intervals * config.decayRate * (PET_UPDATE_INTERVAL / NOTIFICATION_CONFIG.DECAY_TIME_UNIT_MS);
				const stored = pet.needs[key];
				const current = clamp(stored - decrease, 0, 100);

				if (current !== 0) allZero = false;
				// Only notify when crossing threshold to avoid spam
				if (stored >= 30 && current < 30) hasNewUrgent = true;
			}

			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (hasNewUrgent) {
					if (!urgentUsers.has(key)) urgentUsers.set(key, []);
					urgentUsers.get(key)!.push(pet.name);
				}
				if (allZero) {
					if (!zeroUsers.has(key)) zeroUsers.set(key, []);
					zeroUsers.get(key)!.push(pet.name);
				}
			}
		}

		// Notify urgent needs (threshold crossing) — prioritize over zero notifications
		const notifiedUsers = new Set<string>();

		const allUserIds = [...new Set([...urgentUsers.keys(), ...zeroUsers.keys()])];
		const userLangs = await this.batchGetUserLangs(allUserIds);

		for (const [userId, petNames] of urgentUsers) {
			const lang = userLangs.get(userId) || DEFAULT_LANGUAGE;
			const one = petNames.length === 1;
			await this.sendNotificationToUser(new Types.ObjectId(userId), {
				title: nt(lang, one ? 'urgent.title.one' : 'urgent.title.many', { name: petNames[0] }),
				body: nt(lang, one ? 'urgent.body.one' : 'urgent.body.many', {
					name: petNames[0],
					count: petNames.length,
				}),
			});
			notifiedUsers.add(userId);
		}

		// Notify all-zero needs (only for users not already notified above)
		for (const [userId, petNames] of zeroUsers) {
			if (notifiedUsers.has(userId)) continue;

			const lang = userLangs.get(userId) || DEFAULT_LANGUAGE;
			const one = petNames.length === 1;
			await this.sendNotificationToUser(new Types.ObjectId(userId), {
				title: nt(lang, 'zero.title'),
				body: nt(lang, one ? 'zero.body.one' : 'zero.body.many', { name: petNames[0], count: petNames.length }),
			});
		}

		const totalNotified = new Set([...urgentUsers.keys(), ...zeroUsers.keys()]).size;
		if (totalNotified > 0) {
			this.logger.debug(`Sent pet needs notifications to ${totalNotified} user(s)`);
		}
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async checkExpeditionReturns() {
		this.logger.debug('Checking expedition returns for notifications...');

		const now = new Date();
		const windowStart = new Date(now.getTime() - NOTIFICATION_CONFIG.COOLDOWN_MS);

		const pets = await this.petModel
			.find({
				isOnExpedition: true,
				expeditionReturnTime: { $lte: now, $gte: windowStart },
			})
			.lean();
		const usersToNotify = new Map<string, string[]>();

		for (const pet of pets) {
			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (!usersToNotify.has(key)) usersToNotify.set(key, []);
				usersToNotify.get(key)!.push(pet.name);
			}
		}

		const userLangs = await this.batchGetUserLangs([...usersToNotify.keys()]);

		for (const [userId, petNames] of usersToNotify) {
			const lang = userLangs.get(userId) || DEFAULT_LANGUAGE;
			const one = petNames.length === 1;
			this.sendNotificationToUser(new Types.ObjectId(userId), {
				title: nt(lang, 'expedition.title'),
				body: nt(lang, one ? 'expedition.body.one' : 'expedition.body.many', {
					name: petNames[0],
					count: petNames.length,
				}),
			});
		}

		if (usersToNotify.size > 0) {
			this.logger.debug(`Sent expedition return notifications to ${usersToNotify.size} user(s)`);
		}
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async checkEggHatching() {
		this.logger.debug('Checking egg hatching for notifications...');

		const now = new Date();
		const windowStart = new Date(now.getTime() - NOTIFICATION_CONFIG.COOLDOWN_MS);

		const pets = await this.petModel
			.find({
				isEgg: true,
				hatchTime: { $lte: now, $gte: windowStart },
			})
			.lean();
		const usersToNotify = new Map<string, string[]>();

		for (const pet of pets) {
			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (!usersToNotify.has(key)) usersToNotify.set(key, []);
				usersToNotify.get(key)!.push(pet.name);
			}
		}

		const userLangs = await this.batchGetUserLangs([...usersToNotify.keys()]);

		for (const [userId, petNames] of usersToNotify) {
			const lang = userLangs.get(userId) || DEFAULT_LANGUAGE;
			const one = petNames.length === 1;
			this.sendNotificationToUser(new Types.ObjectId(userId), {
				title: nt(lang, 'egg.title'),
				body: nt(lang, one ? 'egg.body.one' : 'egg.body.many', { name: petNames[0], count: petNames.length }),
			});
		}

		if (usersToNotify.size > 0) {
			this.logger.debug(`Sent egg hatching notifications to ${usersToNotify.size} user(s)`);
		}
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async checkClaimAvailability() {
		this.logger.debug('Checking claim availability for notifications...');

		const now = new Date();
		const dailyCooldownMs = CLAIMS_CONFIG.DAILY_COOLDOWN_HOURS * 60 * 60 * 1000;
		const quickCooldownMs = CLAIMS_CONFIG.QUICK_COOLDOWN_HOURS * 60 * 60 * 1000;

		const dailyWindowEnd = new Date(now.getTime() - dailyCooldownMs);
		const dailyWindowStart = new Date(dailyWindowEnd.getTime() - NOTIFICATION_CONFIG.COOLDOWN_MS);

		const quickWindowEnd = new Date(now.getTime() - quickCooldownMs);
		const quickWindowStart = new Date(quickWindowEnd.getTime() - NOTIFICATION_CONFIG.COOLDOWN_MS);

		const users = await this.userModel
			.find({
				$or: [
					{ lastDailyClaimTime: { $gte: dailyWindowStart, $lte: dailyWindowEnd } },
					{ lastQuickClaimTime: { $gte: quickWindowStart, $lte: quickWindowEnd } },
				],
			})
			.lean();
		for (const user of users) {
			const dailyReady =
				user.lastDailyClaimTime &&
				user.lastDailyClaimTime >= dailyWindowStart &&
				user.lastDailyClaimTime <= dailyWindowEnd;
			const quickReady =
				user.lastQuickClaimTime &&
				user.lastQuickClaimTime >= quickWindowStart &&
				user.lastQuickClaimTime <= quickWindowEnd;

			const lang = user.language || DEFAULT_LANGUAGE;
			const bodyKey = dailyReady && quickReady ? 'claims.both' : dailyReady ? 'claims.daily' : 'claims.quick';

			this.sendNotificationToUser(user._id, {
				title: nt(lang, 'claims.title'),
				body: nt(lang, bodyKey),
			});
		}

		if (users.length > 0) {
			this.logger.debug(`Sent claim availability notifications to ${users.length} user(s)`);
		}
	}
}
