import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RequestType, RequestStatus } from '@widgetable/types';
import { Model } from 'mongoose';
import { RequestsService } from 'src/requests/requests.service';
import { User, UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class FriendsService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		private requestsService: RequestsService,
	) {}

	async getFriends(userId: string): Promise<Partial<UserDocument>[]> {
		const user = await this.userModel.findById(userId).populate('friends', '_id name email picture').exec();

		if (!user) throw new NotFoundException();

		return user.friends as unknown as Partial<UserDocument>[];
	}

	async removeFriend(userId: string, friendId: string): Promise<UserDocument> {
		await Promise.all([
			this.userModel.findByIdAndUpdate(userId, {
				$pull: { friends: friendId },
			}),
			this.userModel.findByIdAndUpdate(friendId, {
				$pull: { friends: userId },
			}),
		]);

		const user = await this.userModel.findById(userId).populate('friends', '_id name email picture').exec();

		if (!user) throw new NotFoundException();
		return user;
	}

	async addFriends(userId: string, friendId: string): Promise<void> {
		if (userId === friendId) throw new BadRequestException();

		await Promise.all([
			this.userModel.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } }),
			this.userModel.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } }),
		]);
	}

	async sendFriendRequest(senderId: string, recipientId: string) {
		if (senderId === recipientId) throw new BadRequestException();

		const [sender, recipient] = await Promise.all([
			this.userModel.findById(senderId),
			this.userModel.findById(recipientId),
		]);

		if (!sender || !recipient) throw new NotFoundException();
		if (sender.friends?.some((id) => id.toString() === recipientId)) throw new BadRequestException();

		const [existingRequest, reverseRequest] = await Promise.all([
			this.requestsService.findPendingRequest(RequestType.FRIEND_REQUEST, senderId, recipientId),
			this.requestsService.findPendingRequest(RequestType.FRIEND_REQUEST, recipientId, senderId),
		]);

		if (existingRequest || reverseRequest) throw new BadRequestException();

		return this.requestsService.createRequest(RequestType.FRIEND_REQUEST, senderId, recipientId);
	}

	async acceptFriendRequest(requestId: string, userId: string): Promise<void> {
		const request = await this.requestsService.findRequestById(requestId);
		if (!request) throw new NotFoundException();
		if (
			request.recipientId.toString() !== userId ||
			request.type !== RequestType.FRIEND_REQUEST ||
			request.status !== RequestStatus.PENDING
		) {
			throw new BadRequestException();
		}

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.ACCEPTED);
		await this.addFriends(request.recipientId.toString(), request.senderId.toString());
	}

	async declineFriendRequest(requestId: string, userId: string): Promise<void> {
		const request = await this.requestsService.findRequestById(requestId);
		if (!request) throw new NotFoundException();
		if (
			request.recipientId.toString() !== userId ||
			request.type !== RequestType.FRIEND_REQUEST ||
			request.status !== RequestStatus.PENDING
		) {
			throw new BadRequestException();
		}

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.DECLINED);
	}

	async cancelFriendRequest(requestId: string, userId: string): Promise<void> {
		const request = await this.requestsService.findRequestById(requestId);
		if (!request) throw new NotFoundException();
		if (
			request.senderId.toString() !== userId ||
			request.type !== RequestType.FRIEND_REQUEST ||
			request.status !== RequestStatus.PENDING
		) {
			throw new BadRequestException();
		}

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.CANCELLED);
	}
}
