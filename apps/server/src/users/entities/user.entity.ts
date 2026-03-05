import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ClaimType, Database, DEFAULT_LANGUAGE, UserInventory } from '@widgetable/types';
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

	@Prop({ type: Map, of: Date, default: {} })
	lastClaimTimes?: Map<ClaimType, Date>;

	@Prop({ default: DEFAULT_LANGUAGE })
	language?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User> & Database;
export type UserRequest = Request & { user: UserDocument };
