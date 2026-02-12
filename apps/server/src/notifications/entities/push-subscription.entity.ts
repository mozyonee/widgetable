import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Database } from '@widgetable/types';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class PushSubscription {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
	userId: MongooseSchema.Types.ObjectId;

	@Prop({ required: true, unique: true })
	endpoint: string;

	@Prop({ type: Object, required: true })
	keys: {
		p256dh: string;
		auth: string;
	};

	@Prop({ type: Date, required: false })
	lastNotifiedAt?: Date;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
export type PushSubscriptionDocument = HydratedDocument<PushSubscription> & Database;
