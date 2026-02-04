import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TimeStamps } from 'src/common/interfaces/app.interface';

export enum PetType {
	FOX = 'fox',
	/* CAT = 'cat',
	DOG = 'dog',
	RABBIT = 'rabbit', */
}

@Schema({ timestamps: true })
export class Pet {
	@Prop({
		type: String,
		enum: Object.values(PetType),
		required: true,
	})
	type: PetType;
	@Prop({ required: true })
	name: string;
	@Prop({ type: [Types.ObjectId], ref: 'User', required: true })
	parents: Types.ObjectId[];
	@Prop({ required: true, default: 100 })
	hunger: number;
	@Prop({ required: true, default: 100 })
	thirst: number;
	@Prop({ required: true, default: 100 })
	energy: number;
	@Prop({ required: true, default: 100 })
	hygiene: number;
	@Prop({ required: true, default: 100 })
	toilet: number;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
export type PetDocument = HydratedDocument<Pet> & TimeStamps;
