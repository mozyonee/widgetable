import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Database, UserInventory } from '@widgetable/types';
import { Request } from 'express';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class User {
	@Prop({ required: true, unique: true })
	email: string;

	@Prop({ required: true })
	password: string;

	@Prop({ required: true })
	name: string;

	@Prop()
	picture?: string;

	@Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
	friends?: MongooseSchema.Types.ObjectId[];

	@Prop({ type: Object, default: {} })
	inventory?: UserInventory;

	@Prop({ type: Date, required: false })
	lastDailyClaimTime?: Date;

	@Prop({ type: Date, required: false })
	lastQuickClaimTime?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User> & Database;
export type UserRequest = Request & { user: UserDocument };
