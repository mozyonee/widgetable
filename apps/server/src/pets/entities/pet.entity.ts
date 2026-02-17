import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Database, PetType } from '@widgetable/types';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class PetNeeds {
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

const PetNeedsSchema = SchemaFactory.createForClass(PetNeeds);

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
	@Prop({ type: PetNeedsSchema, required: true, default: () => ({}) })
	needs: PetNeeds;
	@Prop({ required: true, default: false })
	isEgg: boolean;
	@Prop({ required: false })
	hatchTime?: Date;
	@Prop({ required: true, default: 0 })
	experience: number;
	@Prop({ required: true, default: 1 })
	level: number;
	@Prop({ required: false })
	background?: number;
	@Prop({ required: true, default: false })
	isOnExpedition: boolean;
	@Prop({ required: false })
	expeditionReturnTime?: Date;
	@Prop({ type: Date, required: false })
	urgentNotifiedAt?: Date;
	@Prop({ type: Object, required: false })
	expeditionRewards?: {
		food: Array<{ name: string; quantity: number; tier: number }>;
		drinks: Array<{ name: string; quantity: number; tier: number }>;
		hygiene: Array<{ name: string; quantity: number; tier: number }>;
		care: Array<{ name: string; quantity: number; tier: number }>;
		eggs: number;
		valentines?: Array<{ name: string; quantity: number; tier: number }>;
	};
}

export const PetSchema = SchemaFactory.createForClass(Pet);
export type PetDocument = HydratedDocument<Pet> & Database;
