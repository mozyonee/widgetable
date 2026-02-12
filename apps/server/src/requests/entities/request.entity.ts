import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Database, RequestStatus, RequestType } from '@widgetable/types';

export interface RequestMetadata {
	petId?: Types.ObjectId;
	[key: string]: any;
}

@Schema({ timestamps: true })
export class Request {
	@Prop({ required: true, enum: RequestType })
	type: RequestType;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
	senderId: MongooseSchema.Types.ObjectId;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
	recipientId: MongooseSchema.Types.ObjectId;

	@Prop({ required: true, enum: RequestStatus, default: RequestStatus.PENDING })
	status: RequestStatus;

	@Prop({
		type: {
			petId: { type: MongooseSchema.Types.ObjectId, ref: 'Pet' },
		},
		default: {},
		_id: false,
	})
	metadata: RequestMetadata;
}

export const RequestSchema = SchemaFactory.createForClass(Request);

RequestSchema.index({ recipientId: 1, status: 1 });
RequestSchema.index({ senderId: 1, status: 1 });
RequestSchema.index({ type: 1, status: 1 });
RequestSchema.index({ senderId: 1, recipientId: 1, type: 1, status: 1 });

export type RequestDocument = HydratedDocument<Request> & Database;
