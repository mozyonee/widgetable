import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PET_NEED_KEYS, PET_NEEDS_CONFIG, PET_UPDATE_INTERVAL } from '@widgetable/types';
import { clamp } from 'lodash';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './entities/push-subscription.entity';

const NOTIFICATION_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const DECAY_TIME_UNIT = 60 * 1000;

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		@InjectModel(PushSubscription.name) private subscriptionModel: Model<PushSubscriptionDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
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

	async sendTestNotification(userId: Types.ObjectId) {
		const subscriptions = await this.subscriptionModel.find({ userId }).exec();
		if (!subscriptions.length) return { sent: 0 };

		const payload = JSON.stringify({
			title: 'Test notification',
			body: 'If you see this, push notifications work!',
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
				}
			}
		}
		return { sent };
	}

	@Cron(CronExpression.EVERY_10_MINUTES)
	async checkPetNeeds() {
		this.logger.debug('Checking pet needs for notifications...');

		const pets = await this.petModel.find({ isEgg: false, isOnExpedition: false }).lean().exec();

		// Compute current needs and find pets where all needs = 0
		const usersToNotify = new Map<string, string[]>();

		for (const pet of pets) {
			const timeDiff = Date.now() - (pet.updatedAt?.getTime() || 0);
			const intervals = Math.floor(timeDiff / PET_UPDATE_INTERVAL);

			if (intervals <= 0) continue;

			const allZero = PET_NEED_KEYS.every((key) => {
				const config = PET_NEEDS_CONFIG[key];
				const decrease = intervals * config.decayRate * (PET_UPDATE_INTERVAL / DECAY_TIME_UNIT);
				const current = clamp(pet.needs[key] - decrease, 0, 100);
				return current === 0;
			});

			if (!allZero) continue;

			for (const parentId of pet.parents) {
				const key = parentId.toString();
				if (!usersToNotify.has(key)) usersToNotify.set(key, []);
				usersToNotify.get(key)!.push(pet.name);
			}
		}

		if (usersToNotify.size === 0) return;

		const cooldownThreshold = new Date(Date.now() - NOTIFICATION_COOLDOWN);

		for (const [userId, petNames] of usersToNotify) {
			const subscriptions = await this.subscriptionModel
				.find({
					userId: new Types.ObjectId(userId),
					$or: [{ lastNotifiedAt: { $exists: false } }, { lastNotifiedAt: null }, { lastNotifiedAt: { $lt: cooldownThreshold } }],
				})
				.exec();

			const payload = JSON.stringify({
				title: 'Your pets need you!',
				body:
					petNames.length === 1
						? `${petNames[0]} needs your attention — all needs are at zero!`
						: `${petNames.length} pets need your attention!`,
				icon: '/icon-192x192.png',
				url: '/',
			});

			const now = new Date();
			for (const sub of subscriptions) {
				try {
					await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, payload);
					await this.subscriptionModel.updateOne({ _id: sub._id }, { lastNotifiedAt: now });
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

		this.logger.debug(`Sent notifications to ${usersToNotify.size} user(s)`);
	}
}
