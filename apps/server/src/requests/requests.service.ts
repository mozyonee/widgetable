import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { USER_POPULATE_FIELDS } from 'src/shared/constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Request, RequestDocument, RequestMetadata } from './entities/request.entity';
import { RequestType, RequestStatus } from '@widgetable/types';

@Injectable()
export class RequestsService {
	constructor(@InjectModel(Request.name) private requestModel: Model<RequestDocument>) {}

	async getRequests(userId: Types.ObjectId, type?: RequestType) {
		const query = {
			$or: [{ senderId: userId }, { recipientId: userId }],
			status: RequestStatus.PENDING,
			...(type && { type }),
		};

		const requests = await this.requestModel
			.find(query)
			.populate('senderId', USER_POPULATE_FIELDS)
			.populate('recipientId', USER_POPULATE_FIELDS)
			.populate('metadata.petId');
		// Transform to match frontend expectations
		const transformedRequests = requests.map((req) => {
			const obj = req.toObject();
			const pet = obj.metadata?.petId;

			// Ensure pet has valid needs object with defaults if it's a populated document
			if (pet && typeof pet === 'object' && '_id' in pet && !('needs' in pet)) {
				(pet as unknown as Record<string, unknown>).needs = {
					hunger: 100,
					thirst: 100,
					energy: 100,
					hygiene: 100,
					toilet: 100,
				};
			}

			return {
				...obj,
				sender: obj.senderId,
				recipient: obj.recipientId,
				metadata: {
					...obj.metadata,
					pet,
				},
			};
		});

		const valid = transformedRequests.filter((req) => req.senderId && req.recipientId);
		const sent = valid.filter((req) => {
			const sender = req.senderId as unknown as { _id: { toString(): string } };
			return sender._id.toString() === userId.toString();
		});
		const received = valid.filter((req) => {
			const recipient = req.recipientId as unknown as { _id: { toString(): string } };
			return recipient._id.toString() === userId.toString();
		});

		return { sent, received };
	}

	async createRequest(
		type: RequestType,
		senderId: Types.ObjectId,
		recipientId: Types.ObjectId,
		metadata?: RequestMetadata,
	): Promise<RequestDocument> {
		const request = new this.requestModel({
			type,
			senderId,
			recipientId,
			status: RequestStatus.PENDING,
			metadata: metadata || {},
		});

		return request.save();
	}

	async findRequestById(requestId: Types.ObjectId): Promise<RequestDocument | null> {
		return this.requestModel.findById(requestId);
	}

	async validateRequestAction(
		requestId: Types.ObjectId,
		userId: Types.ObjectId,
		type: RequestType,
		role: 'sender' | 'recipient',
	): Promise<RequestDocument> {
		const request = await this.findRequestById(requestId);
		if (!request) throw new NotFoundException();

		const userIdMatches =
			role === 'sender'
				? (request.senderId as { toString(): string }).toString() === userId.toString()
				: (request.recipientId as { toString(): string }).toString() === userId.toString();

		if (!userIdMatches || request.type !== type || request.status !== RequestStatus.PENDING) {
			throw new BadRequestException();
		}

		return request;
	}

	async findPendingRequest(
		type: RequestType,
		senderId: Types.ObjectId,
		recipientId: Types.ObjectId,
		metadataFilter?: Record<string, unknown>,
	): Promise<RequestDocument | null> {
		const query = {
			type,
			senderId,
			recipientId,
			status: RequestStatus.PENDING,
			...(metadataFilter &&
				Object.fromEntries(Object.entries(metadataFilter).map(([key, value]) => [`metadata.${key}`, value]))),
		};

		return this.requestModel.findOne(query);
	}

	async updateRequestStatus(
		requestId: Types.ObjectId,
		status: RequestStatus,
		session?: ClientSession,
	): Promise<RequestDocument> {
		const request = await this.requestModel.findByIdAndUpdate(requestId, { status }, { new: true, session });

		if (!request) throw new NotFoundException();
		return request;
	}

	async deleteRequest(requestId: Types.ObjectId): Promise<void> {
		await this.requestModel.findByIdAndDelete(requestId);
	}
}
