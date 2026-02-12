import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PET_NEED_KEYS, PET_NEEDS_CONFIG, PET_UPDATE_INTERVAL } from '@widgetable/types';
import { clamp } from 'lodash';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './entities/push-subscription.entity';

const NOTIFICATION_COOLDOWN = 10 * 60 * 1000; // 10 minutes
const DECAY_TIME_UNIT = 60 * 1000;

const NOTIF_I18N: Record<string, Record<string, string>> = {
	en: {
		'urgent.title.one': '{name} is sad!',
		'urgent.title.many': 'Your pets are sad!',
		'urgent.body.one': '{name} needs your attention!',
		'urgent.body.many': '{count} pets need your attention!',
		'zero.title': 'Your pets need you!',
		'zero.body.one': '{name} needs your attention — all needs are at zero!',
		'zero.body.many': '{count} pets need your attention!',
		'expedition.title': 'Expedition Complete!',
		'expedition.body.one': '{name} has returned from the expedition!',
		'expedition.body.many': '{count} pets have returned from their expeditions!',
		'egg.title': 'Egg Hatched!',
		'egg.body.one': '{name} has hatched!',
		'egg.body.many': '{count} eggs have hatched!',
		'claims.title': 'Goodies Available!',
		'claims.both': 'Your daily and quick goodies are ready to collect!',
		'claims.daily': 'Your daily goodies are ready to collect!',
		'claims.quick': 'Your quick goodies are ready to collect!',
		'test.title': 'Test Notification',
		'test.body': 'If you see this, push notifications are working!',
	},
	ru: {
		'urgent.title.one': '{name} грустит!',
		'urgent.title.many': 'Ваши питомцы грустят!',
		'urgent.body.one': '{name} нуждается в вашем внимании!',
		'urgent.body.many': '{count} питомцев нуждаются в вашем внимании!',
		'zero.title': 'Ваши питомцы ждут вас!',
		'zero.body.one': 'Все показатели {name} на нуле!',
		'zero.body.many': '{count} питомцев нуждаются в вашем внимании!',
		'expedition.title': 'Охота завершена!',
		'expedition.body.one': '{name} вернулся с охоты!',
		'expedition.body.many': '{count} питомцев вернулись с охоты!',
		'egg.title': 'Яйцо вылупилось!',
		'egg.body.one': '{name} вылупился!',
		'egg.body.many': '{count} яиц вылупились!',
		'claims.title': 'Припасы готовы!',
		'claims.both': 'Ежедневные и быстрые припасы готовы к сбору!',
		'claims.daily': 'Ежедневные припасы готовы к сбору!',
		'claims.quick': 'Быстрые припасы готовы к сбору!',
		'test.title': 'Тестовое уведомление',
		'test.body': 'Если вы видите это, уведомления работают!',
	},
};

const nt = (lang: string, key: string, params?: Record<string, string | number>): string => {
	const str = NOTIF_I18N[lang]?.[key] || NOTIF_I18N['en'][key] || key;
	if (!params) return str;
	return Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), str);
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
		const subject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:admin@widgetable.app');

		if (publicKey && privateKey) {
			webpush.setVapidDetails(subject, publicKey, privateKey);
		}
	}

	async subscribe(userId: Types.ObjectId, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
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
		const user = await this.userModel.findById(userId).select('language').lean().exec();
		return user?.language || 'en';
	}

	async sendTestNotification(userId: Types.ObjectId) {
		const subscriptions = await this.subscriptionModel.find({ userId }).exec();

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
			} catch (error: any) {
				if (error.statusCode === 410 || error.statusCode === 404) {
					await this.subscriptionModel.deleteOne({ _id: sub._id });
					this.logger.debug(`Removed expired subscription: ${sub.endpoint}`);
				} else {
					this.logger.error(`Failed to send test notification: ${error.message}`);
				}
			}
		}

		return { sent, total: subscriptions.length };
	}

	async sendNotificationToUser(
		userId: string | Types.ObjectId,
		payload: { title: string; body: string; icon?: string; url?: string },
	): Promise<void> {
		const subscriptions = await this.subscriptionModel
			.find({ userId: new Types.ObjectId(userId.toString()) })
			.exec();

		const data = JSON.stringify({
			...payload,
			icon: payload.icon ?? '/icon-192x192.png',
			url: payload.url ?? '/',
		});

		for (const sub of subscriptions) {
			try {
				await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, data);
			} catch (error: any) {
				if (error.statusCode === 410 || error.statusCode === 404) {
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

		const pets = await this.petModel.find({ isEgg: false, isOnExpedition: false }).lean().exec();

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
				const decrease = intervals * config.decayRate * (PET_UPDATE_INTERVAL / DECAY_TIME_UNIT);
				const stored = pet.needs[key];
				const current = clamp(stored - decrease, 0, 100);

				if (current !== 0) allZero = false;
				// Detect threshold crossing: stored was >=30 but decayed below 30
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

		for (const [userId, petNames] of urgentUsers) {
			const lang = await this.getUserLang(userId);
			const one = petNames.length === 1;
			await this.sendNotificationToUser(userId, {
				title: nt(lang, one ? 'urgent.title.one' : 'urgent.title.many', { name: petNames[0] }),
				body: nt(lang, one ? 'urgent.body.one' : 'urgent.body.many', { name: petNames[0], count: petNames.length }),
			});
			notifiedUsers.add(userId);
		}

		// Notify all-zero needs (only for users not already notified above)
		for (const [userId, petNames] of zeroUsers) {
			if (notifiedUsers.has(userId)) continue;

			const lang = await this.getUserLang(userId);
			const one = petNames.length === 1;
			await this.sendNotificationToUser(userId, {
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
		const windowStart = new Date(now.getTime() - NOTIFICATION_COOLDOWN);

		const pets = await this.petModel
			.find({
				isOnExpedition: true,
				expeditionReturnTime: { $lte: now, $gte: windowStart },
			})
			.lean()
			.exec();

		const usersToNotify = new Map<string, string[]>();

		for (const pet of pets) {
			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (!usersToNotify.has(key)) usersToNotify.set(key, []);
				usersToNotify.get(key)!.push(pet.name);
			}
		}

		for (const [userId, petNames] of usersToNotify) {
			const lang = await this.getUserLang(userId);
			const one = petNames.length === 1;
			this.sendNotificationToUser(userId, {
				title: nt(lang, 'expedition.title'),
				body: nt(lang, one ? 'expedition.body.one' : 'expedition.body.many', { name: petNames[0], count: petNames.length }),
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
		const windowStart = new Date(now.getTime() - NOTIFICATION_COOLDOWN);

		const pets = await this.petModel
			.find({
				isEgg: true,
				hatchTime: { $lte: now, $gte: windowStart },
			})
			.lean()
			.exec();

		const usersToNotify = new Map<string, string[]>();

		for (const pet of pets) {
			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (!usersToNotify.has(key)) usersToNotify.set(key, []);
				usersToNotify.get(key)!.push(pet.name);
			}
		}

		for (const [userId, petNames] of usersToNotify) {
			const lang = await this.getUserLang(userId);
			const one = petNames.length === 1;
			this.sendNotificationToUser(userId, {
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
		const dailyCooldownMs = 24 * 60 * 60 * 1000;
		const quickCooldownMs = 4 * 60 * 60 * 1000;

		// Daily became available if lastDailyClaimTime is between (now - 24h - 10min) and (now - 24h)
		const dailyWindowEnd = new Date(now.getTime() - dailyCooldownMs);
		const dailyWindowStart = new Date(dailyWindowEnd.getTime() - NOTIFICATION_COOLDOWN);

		const quickWindowEnd = new Date(now.getTime() - quickCooldownMs);
		const quickWindowStart = new Date(quickWindowEnd.getTime() - NOTIFICATION_COOLDOWN);

		const users = await this.userModel
			.find({
				$or: [
					{ lastDailyClaimTime: { $gte: dailyWindowStart, $lte: dailyWindowEnd } },
					{ lastQuickClaimTime: { $gte: quickWindowStart, $lte: quickWindowEnd } },
				],
			})
			.lean()
			.exec();

		for (const user of users) {
			const dailyReady =
				user.lastDailyClaimTime &&
				user.lastDailyClaimTime >= dailyWindowStart &&
				user.lastDailyClaimTime <= dailyWindowEnd;
			const quickReady =
				user.lastQuickClaimTime &&
				user.lastQuickClaimTime >= quickWindowStart &&
				user.lastQuickClaimTime <= quickWindowEnd;

			const lang = user.language || 'en';
			const bodyKey = dailyReady && quickReady ? 'claims.both' : dailyReady ? 'claims.daily' : 'claims.quick';

			this.sendNotificationToUser(user._id.toString(), {
				title: nt(lang, 'claims.title'),
				body: nt(lang, bodyKey),
			});
		}

		if (users.length > 0) {
			this.logger.debug(`Sent claim availability notifications to ${users.length} user(s)`);
		}
	}
}
