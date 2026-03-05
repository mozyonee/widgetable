import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { USER_POPULATE_FIELDS } from 'src/users/users.constants';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { RequestType, RequestStatus, DEFAULT_LANGUAGE } from '@widgetable/types';
import { Model, Connection, Types } from 'mongoose';
import { NotificationsService, nt } from 'src/notifications/notifications.service';
import { RequestsService } from 'src/requests/requests.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class FriendsService extends BaseService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectConnection() connection: Connection,
		private requestsService: RequestsService,
		private notificationsService: NotificationsService,
	) {
		super(connection);
	}

	async getFriends(userId: Types.ObjectId): Promise<Partial<UserDocument>[]> {
		const user = await this.userModel.findById(userId).populate('friends', USER_POPULATE_FIELDS);

		if (!user) throw new NotFoundException();

		return user.friends as unknown as Partial<UserDocument>[];
	}

	async removeFriend(userId: Types.ObjectId, friendId: Types.ObjectId): Promise<UserDocument> {
		await this.withTransaction(async (session) => {
			await Promise.all([
				this.userModel.findByIdAndUpdate(userId, { $pull: { friends: friendId } }, { session }),
				this.userModel.findByIdAndUpdate(friendId, { $pull: { friends: userId } }, { session }),
			]);
		});

		const user = await this.userModel.findById(userId).populate('friends', USER_POPULATE_FIELDS);

		if (!user) throw new NotFoundException();
		return user;
	}

	async addFriends(userId: Types.ObjectId, friendId: Types.ObjectId): Promise<void> {
		if (userId.equals(friendId)) throw new BadRequestException();

		await Promise.all([
			this.userModel.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } }),
			this.userModel.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } }),
		]);
	}

	async sendFriendRequest(senderId: Types.ObjectId, recipientId: Types.ObjectId) {
		if (senderId.equals(recipientId)) throw new BadRequestException();

		const [sender, recipient] = await Promise.all([
			this.userModel.findById(senderId),
			this.userModel.findById(recipientId),
		]);

		if (!sender || !recipient) throw new NotFoundException();
		if (sender.friends?.some((id: { toString(): string }) => id.toString() === recipientId.toString()))
			throw new BadRequestException();

		const [existingRequest, reverseRequest] = await Promise.all([
			this.requestsService.findPendingRequest(RequestType.FRIEND_REQUEST, senderId, recipientId),
			this.requestsService.findPendingRequest(RequestType.FRIEND_REQUEST, recipientId, senderId),
		]);

		if (existingRequest || reverseRequest) throw new BadRequestException();

		const request = await this.requestsService.createRequest(RequestType.FRIEND_REQUEST, senderId, recipientId);

		const lang = recipient.language || DEFAULT_LANGUAGE;
		await this.notificationsService.sendNotificationToUser(recipientId, {
			title: nt(lang, 'friend.title'),
			body: nt(lang, 'friend.body', { sender: sender.name }),
			url: '/friends',
		});

		return request;
	}

	async acceptFriendRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
		const request = await this.requestsService.validateRequestAction(
			requestId,
			userId,
			RequestType.FRIEND_REQUEST,
			'recipient',
		);

		await this.withTransaction(async (session) => {
			await this.requestsService.updateRequestStatus(requestId, RequestStatus.ACCEPTED, session);

			await Promise.all([
				this.userModel.findByIdAndUpdate(
					request.recipientId,
					{ $addToSet: { friends: request.senderId } },
					{ session },
				),
				this.userModel.findByIdAndUpdate(
					request.senderId,
					{ $addToSet: { friends: request.recipientId } },
					{ session },
				),
			]);
		});
	}

	async declineFriendRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
		await this.requestsService.validateRequestAction(requestId, userId, RequestType.FRIEND_REQUEST, 'recipient');

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.DECLINED);
	}

	async cancelFriendRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
		await this.requestsService.validateRequestAction(requestId, userId, RequestType.FRIEND_REQUEST, 'sender');

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.CANCELLED);
	}
}
