import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { DEFAULT_LANGUAGE, isValentineGiftItem } from '@widgetable/types';
import { Model, Connection, Types } from 'mongoose';
import { NotificationsService, nt } from 'src/notifications/notifications.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class GiftsService extends BaseService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectConnection() connection: Connection,
		private readonly usersService: UsersService,
		private readonly notificationsService: NotificationsService,
	) {
		super(connection);
	}

	async sendGift(senderId: Types.ObjectId, recipientId: string, itemName: string, quantity: number) {
		if (senderId.toString() === recipientId) throw new BadRequestException();
		if (quantity < 1) throw new BadRequestException();
		if (!isValentineGiftItem(itemName)) throw new BadRequestException();

		const sender = await this.userModel.findById(senderId);
		if (!sender) throw new NotFoundException();

		const isFriend = sender.friends?.some((id) => id.toString() === recipientId);
		if (!isFriend) throw new BadRequestException();

		const recipientObjectId = new Types.ObjectId(recipientId);

		const hasItem = await this.usersService.hasInventory(senderId, itemName, quantity);
		if (!hasItem) throw new BadRequestException();

		await this.usersService.consumeInventory(senderId, itemName, quantity);

		const recipient = await this.userModel.findById(recipientId);
		const lang = recipient?.language || DEFAULT_LANGUAGE;

		this.notificationsService.sendNotificationToUser(recipientObjectId, {
			title: nt(lang, 'gift.title'),
			body: nt(lang, 'gift.body', { sender: sender.name }),
			url: '/friends',
		});

		return { success: true };
	}
}
