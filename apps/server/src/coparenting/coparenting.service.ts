import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RequestStatus, RequestType } from '@widgetable/types';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { RequestsService } from 'src/requests/requests.service';
import { User, UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class CoparentingService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		private requestsService: RequestsService,
	) {}

	async sendCoparentingRequest(senderId: string, recipientId: string, petId: string) {
		if (senderId === recipientId) throw new BadRequestException();

		const [sender, recipient, pet] = await Promise.all([
			this.userModel.findById(senderId),
			this.userModel.findById(recipientId),
			this.petModel.findById(petId),
		]);

		if (!sender || !recipient || !pet) throw new NotFoundException();
		if (!pet.parents.some((parentId: any) => parentId.toString() === senderId)) throw new BadRequestException();
		if (!sender.friends?.some((id: any) => id.toString() === recipientId)) throw new BadRequestException();
		if (pet.parents.some((parentId: any) => parentId.toString() === recipientId)) throw new BadRequestException();

		const petObjectId = new Types.ObjectId(petId);
		const existingRequest = await this.requestsService.findPendingRequest(
			RequestType.COPARENTING_REQUEST,
			senderId,
			recipientId,
			{ petId: petObjectId },
		);
		if (existingRequest) throw new BadRequestException();

		return this.requestsService.createRequest(RequestType.COPARENTING_REQUEST, senderId, recipientId, {
			petId: petObjectId,
		});
	}

	async acceptCoparentingRequest(requestId: string, userId: string): Promise<void> {
		const request = await this.requestsService.findRequestById(requestId);
		if (!request) throw new NotFoundException();
		if (
			request.recipientId.toString() !== userId ||
			request.type !== RequestType.COPARENTING_REQUEST ||
			request.status !== RequestStatus.PENDING
		) {
			throw new BadRequestException();
		}

		const petId = request.metadata.petId;
		if (!petId) throw new BadRequestException();

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.ACCEPTED);
		await this.petModel.findByIdAndUpdate(petId, { $addToSet: { parents: new Types.ObjectId(userId) } });
	}

	async declineCoparentingRequest(requestId: string, userId: string): Promise<void> {
		const request = await this.requestsService.findRequestById(requestId);
		if (!request) throw new NotFoundException();
		if (
			request.recipientId.toString() !== userId ||
			request.type !== RequestType.COPARENTING_REQUEST ||
			request.status !== RequestStatus.PENDING
		) {
			throw new BadRequestException();
		}

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.DECLINED);
	}

	async cancelCoparentingRequest(requestId: string, userId: string): Promise<void> {
		const request = await this.requestsService.findRequestById(requestId);
		if (!request) throw new NotFoundException();
		if (
			request.senderId.toString() !== userId ||
			request.type !== RequestType.COPARENTING_REQUEST ||
			request.status !== RequestStatus.PENDING
		) {
			throw new BadRequestException();
		}

		await this.requestsService.updateRequestStatus(requestId, RequestStatus.CANCELLED);
	}
}
