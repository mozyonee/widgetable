import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { translate } from '@widgetable/i18n';
import {
	calculateDecayedNeeds,
	CLAIM_TYPE_CONFIG,
	ClaimType,
	DEFAULT_LANGUAGE,
	isClaimAvailable,
	NOTIFICATION_CONFIG,
	PET_THRESHOLDS,
} from '@widgetable/types';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { WEBPUSH_CONFIG } from './notifications.constants';
import { User, UserDocument } from 'src/users/entities/user.entity';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './entities/push-subscription.entity';

export const nt = (lang: string, key: string, params?: Record<string, string | number>): string => {
	return translate(lang, `notif.${key}`, params);
};

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);
	// petId → expiry timestamp; replaces urgentNotifiedAt DB field
	private readonly urgentCooldowns = new Map<string, number>();

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
				await webpush.sendNotification(
					{ endpoint: sub.endpoint, keys: sub.keys as webpush.PushSubscription['keys'] },
					data,
				);
			} catch (error) {
				const err = error as { statusCode?: number };
				if (
					err.statusCode &&
					(WEBPUSH_CONFIG.INVALID_SUBSCRIPTION_CODES as readonly number[]).includes(err.statusCode)
				) {
					await this.subscriptionModel.deleteOne({ _id: sub._id });
					this.logger.debug(`Removed expired subscription: ${sub.endpoint}`);
				} else {
					this.logger.error(
						`Failed to send notification: ${(error as { message?: string }).message ?? 'Unknown error'}`,
					);
				}
			}
		}
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async checkPetNeeds() {
		this.logger.debug('Checking pet needs for notifications...');

		const pets = await this.petModel.find({ isEgg: false, isOnExpedition: false }).lean();

		const urgentUsers = new Map<string, { names: string[]; petIds: Types.ObjectId[] }>();
		const zeroUsers = new Map<string, string[]>();
		const now = Date.now();

		for (const pet of pets) {
			const lastUpdatedAt = pet.needsUpdatedAt ?? pet.updatedAt ?? new Date();
			const { needs: currentNeeds, changed } = calculateDecayedNeeds(pet.needs, lastUpdatedAt, new Date(now));

			if (!changed) continue;

			let hasNewUrgent = false;
			let allZero = true;

			for (const key of Object.keys(currentNeeds) as (keyof typeof currentNeeds)[]) {
				const current = currentNeeds[key];
				if (current !== 0) allZero = false;
				// Only notify when crossing threshold to avoid spam
				if (pet.needs[key] >= PET_THRESHOLDS.URGENT && current < PET_THRESHOLDS.URGENT) hasNewUrgent = true;
			}

			const petId = pet._id.toString();
			const cooldownExpiry = this.urgentCooldowns.get(petId) ?? 0;
			if (hasNewUrgent && now < cooldownExpiry) {
				hasNewUrgent = false;
			}

			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (hasNewUrgent) {
					if (!urgentUsers.has(key)) urgentUsers.set(key, { names: [], petIds: [] });
					urgentUsers.get(key)!.names.push(pet.name);
					urgentUsers.get(key)!.petIds.push(pet._id);
				}
				if (allZero) {
					if (!zeroUsers.has(key)) zeroUsers.set(key, []);
					zeroUsers.get(key)!.push(pet.name);
				}
			}
		}

		// Notify urgent needs (threshold crossing) — prioritize over zero notifications
		const notifiedUsers = new Set<string>();
		const notifiedPetIds = new Set<string>();

		const allUserIds = [...new Set([...urgentUsers.keys(), ...zeroUsers.keys()])];
		const userLangs = await this.batchGetUserLangs(allUserIds);

		for (const [userId, { names, petIds }] of urgentUsers) {
			const lang = userLangs.get(userId) || DEFAULT_LANGUAGE;
			const one = names.length === 1;
			await this.sendNotificationToUser(new Types.ObjectId(userId), {
				title: nt(lang, one ? 'urgent.title.one' : 'urgent.title.many', { name: names[0] }),
				body: nt(lang, one ? 'urgent.body.one' : 'urgent.body.many', {
					name: names[0],
					count: names.length,
				}),
			});
			notifiedUsers.add(userId);
			for (const petId of petIds) notifiedPetIds.add(petId.toString());
		}

		const cooldownExpiry = now + NOTIFICATION_CONFIG.PET_NEEDS_COOLDOWN_MS;
		for (const petId of notifiedPetIds) {
			this.urgentCooldowns.set(petId, cooldownExpiry);
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
			await this.sendNotificationToUser(new Types.ObjectId(userId), {
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
			await this.sendNotificationToUser(new Types.ObjectId(userId), {
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

		// Build per-type window starts and query conditions
		const orConditions = Object.values(ClaimType).map((type) => {
			const windowStart = new Date(
				now.getTime() - CLAIM_TYPE_CONFIG[type].cooldownHours * 3600000 - NOTIFICATION_CONFIG.COOLDOWN_MS,
			);
			return { [`lastClaimTimes.${type}`]: { $gte: windowStart } };
		});

		const users = await this.userModel.find({ $or: orConditions }).lean();

		for (const user of users) {
			const readyTypes = Object.values(ClaimType).filter((type) => {
				const lastTime = user.lastClaimTimes?.[type as unknown as keyof typeof user.lastClaimTimes];
				return isClaimAvailable(lastTime, CLAIM_TYPE_CONFIG[type].cooldownHours, now);
			});

			if (readyTypes.length === 0) continue;

			const lang = user.language || DEFAULT_LANGUAGE;
			const bodyKey = readyTypes.length > 1 ? 'items.all' : `items.${readyTypes[0]}`;

			await this.sendNotificationToUser(user._id, {
				title: nt(lang, 'items.title'),
				body: nt(lang, bodyKey),
			});
		}

		if (users.length > 0) {
			this.logger.debug(`Sent claim availability notifications to ${users.length} user(s)`);
		}
	}
}
