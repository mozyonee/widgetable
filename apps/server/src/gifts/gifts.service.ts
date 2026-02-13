import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValentineGiftItem } from '@widgetable/types';
import { Model } from 'mongoose';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

const GIFT_NOTIF_I18N: Record<string, Record<string, string>> = {
	en: {
		title: 'Valentine Gift!',
		body: '{sender} sent you a valentine!',
	},
	ru: {
		title: 'Валентинка!',
		body: '{sender} отправил вам валентинку!',
	},
};

@Injectable()
export class GiftsService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		private readonly usersService: UsersService,
		private readonly notificationsService: NotificationsService,
	) {}

	async sendGift(senderId: string, recipientId: string, itemName: string, quantity: number) {
		if (senderId === recipientId) throw new BadRequestException('Cannot send gift to yourself');
		if (quantity < 1) throw new BadRequestException('Quantity must be at least 1');
		if (!isValentineGiftItem(itemName)) throw new BadRequestException('Item is not giftable');

		const sender = await this.userModel.findById(senderId).exec();
		if (!sender) throw new NotFoundException('Sender not found');

		const isFriend = sender.friends?.some((id) => id.toString() === recipientId);
		if (!isFriend) throw new BadRequestException('Recipient is not a friend');

		const hasItem = await this.usersService.hasInventory(senderId, itemName, quantity);
		if (!hasItem) throw new BadRequestException('Insufficient inventory');

		await this.usersService.consumeInventory(senderId, itemName, quantity);
		await this.usersService.addInventory(recipientId, itemName, quantity);

		const recipient = await this.userModel.findById(recipientId).exec();
		const lang = recipient?.language || 'en';
		const i18n = GIFT_NOTIF_I18N[lang] || GIFT_NOTIF_I18N.en;

		this.notificationsService.sendNotificationToUser(recipientId, {
			title: i18n.title,
			body: i18n.body.replace('{sender}', sender.name),
			url: '/friends',
		});

		return { success: true };
	}
}
