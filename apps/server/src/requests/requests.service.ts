import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, RequestDocument, RequestMetadata } from './entities/request.entity';
import { RequestType, RequestStatus } from '@widgetable/types';

@Injectable()
export class RequestsService {
	constructor(@InjectModel(Request.name) private requestModel: Model<RequestDocument>) {}

	async getRequests(userId: string, type?: RequestType) {
		const query: any = {
			$or: [{ senderId: userId }, { recipientId: userId }],
			status: RequestStatus.PENDING,
		};

		if (type) {
			query.type = type;
		}

		const requests = await this.requestModel
			.find(query)
			.populate('senderId', '_id name email picture')
			.populate('recipientId', '_id name email picture')
			.populate('metadata.petId')
			.exec();

		// Transform to match frontend expectations
		const transformedRequests = requests.map((req) => {
			const obj = req.toObject();
			const pet = obj.metadata?.petId as any;

			// Ensure pet has valid needs object with defaults if it's a populated document
			if (pet && typeof pet === 'object' && '_id' in pet && !pet.needs) {
				pet.needs = {
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
		const sent = valid.filter((req) => (req.senderId as any)._id.toString() === userId);
		const received = valid.filter((req) => (req.recipientId as any)._id.toString() === userId);

		return { sent, received };
	}

	async createRequest(
		type: RequestType,
		senderId: string,
		recipientId: string,
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

	async findRequestById(requestId: string): Promise<RequestDocument | null> {
		return this.requestModel.findById(requestId).exec();
	}

	async findPendingRequest(
		type: RequestType,
		senderId: string,
		recipientId: string,
		metadataFilter?: any,
	): Promise<RequestDocument | null> {
		const query: any = {
			type,
			senderId,
			recipientId,
			status: RequestStatus.PENDING,
		};

		if (metadataFilter) {
			Object.entries(metadataFilter).forEach(([key, value]) => {
				query[`metadata.${key}`] = value;
			});
		}

		return this.requestModel.findOne(query).exec();
	}

	async updateRequestStatus(requestId: string, status: RequestStatus): Promise<RequestDocument> {
		const request = await this.requestModel.findByIdAndUpdate(requestId, { status }, { new: true });

		if (!request) throw new NotFoundException();
		return request;
	}

	async deleteRequest(requestId: string): Promise<void> {
		await this.requestModel.findByIdAndDelete(requestId);
	}
}
