import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { DEFAULT_LANGUAGE, RequestStatus, RequestType } from '@widgetable/types';
import { Model, Types, Connection } from 'mongoose';
import { NotificationsService, nt } from 'src/notifications/notifications.service';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { RequestsService } from 'src/requests/requests.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { BaseService } from 'src/common/base.service';

@Injectable()
export class CoparentingService extends BaseService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		@InjectConnection() connection: Connection,
		private requestsService: RequestsService,
		private notificationsService: NotificationsService,
	) {
		super(connection);
	}

	async sendCoparentingRequest(senderId: Types.ObjectId, recipientId: Types.ObjectId, petId: Types.ObjectId) {
		if (senderId.equals(recipientId)) throw new BadRequestException();

		const [sender, recipient, pet] = await Promise.all([
			this.userModel.findById(senderId),
			this.userModel.findById(recipientId),
			this.petModel.findById(petId),
		]);

		if (!sender || !recipient || !pet) throw new NotFoundException();
		if (!pet.parents.some((parentId) => parentId.toString() === senderId.toString()))
			throw new BadRequestException();
		if (!sender.friends?.some((id) => id.toString() === recipientId.toString())) throw new BadRequestException();
		if (pet.parents.some((parentId) => parentId.toString() === recipientId.toString()))
			throw new BadRequestException();

		const existingRequest = await this.requestsService.findPendingRequest(
			RequestType.COPARENTING_REQUEST,
			senderId,
			recipientId,
			{ petId },
		);
		if (existingRequest) throw new BadRequestException();

		const request = await this.requestsService.createRequest(
			RequestType.COPARENTING_REQUEST,
			senderId,
			recipientId,
			{
				petId,
			},
		);

		const lang = recipient.language || DEFAULT_LANGUAGE;
		this.notificationsService.sendNotificationToUser(recipientId, {
			title: nt(lang, 'coparenting.title'),
			body: nt(lang, 'coparenting.body', { sender: sender.name, pet: pet.name }),
			url: '/friends',
		});

		return request;
	}

	async acceptCoparentingRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
		const request = await this.requestsService.validateRequestAction(
			requestId,
			userId,
			RequestType.COPARENTING_REQUEST,
			'recipient',
		);

		const petId = request.metadata.petId;
		if (!petId) throw new BadRequestException();

		await this.withTransaction(async (session) => {
			await this.requestsService.updateRequestStatus(requestId, RequestStatus.ACCEPTED, session);
			await this.petModel.findByIdAndUpdate(petId, { $addToSet: { parents: userId } }, { session });
		});
	}

	async declineCoparentingRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
		await this.requestsService.validateRequestAction(
			requestId,
			userId,
			RequestType.COPARENTING_REQUEST,
			'recipient',
		);

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.DECLINED);
	}

	async cancelCoparentingRequest(requestId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
		await this.requestsService.validateRequestAction(requestId, userId, RequestType.COPARENTING_REQUEST, 'sender');

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.CANCELLED);
	}
}
