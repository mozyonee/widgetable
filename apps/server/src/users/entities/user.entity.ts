import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Request } from 'express';
import { HydratedDocument } from 'mongoose';
import { Cookies, TimeStamps } from 'src/common/interfaces/app.interface';

@Schema({ timestamps: true })
export class User {
	@Prop({ required: true, unique: true })
	email: string;

	@Prop({ required: true })
	password: string;

	@Prop()
	picture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User> & TimeStamps;
export type UserRequest = Request & { user: UserDocument } & { cookies: Cookies };
