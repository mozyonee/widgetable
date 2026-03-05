import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DEFAULT_LANGUAGE, isValentineGiftItem } from '@widgetable/types';
import { Model, Types } from 'mongoose';
import { NotificationsService, nt } from 'src/notifications/notifications.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GiftsService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		private readonly usersService: UsersService,
		private readonly notificationsService: NotificationsService,
	) {}

	async sendGift(senderId: Types.ObjectId, recipientId: string, itemName: string, quantity: number) {
		if (senderId.toString() === recipientId) throw new BadRequestException();
		if (quantity < 1) throw new BadRequestException();
		if (!isValentineGiftItem(itemName)) throw new BadRequestException();

		const sender = await this.userModel.findById(senderId);
		if (!sender) throw new NotFoundException();

		const isFriend = sender.friends?.some((id: { toString(): string }) => id.toString() === recipientId);
		if (!isFriend) throw new BadRequestException();

		const recipientObjectId = new Types.ObjectId(recipientId);

		await this.usersService.consumeInventory(senderId, itemName, quantity);

		const recipient = await this.userModel.findById(recipientId);
		const lang = recipient?.language || DEFAULT_LANGUAGE;

		await this.notificationsService.sendNotificationToUser(recipientObjectId, {
			title: nt(lang, 'gift.title'),
			body: nt(lang, 'gift.body', { sender: sender.name }),
			url: '/friends',
		});

		return { success: true };
	}
}
