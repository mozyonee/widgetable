import { Database } from '../database';
import { PetActionCategory, PetAnimation, PetNeed, PetType } from './enums';

export interface PetNeedConfig {
	decayDuration: number;
	urgencyMessage: string;
	category: PetActionCategory;
	animation: PetAnimation;
}

export type PetNeedKey = PetNeed;
export type PetNeeds = Record<PetNeedKey, number>;

export interface PetAction {
	name: string;
	needKey: PetNeedKey;
	amount: number;
	inventoryCost?: number;
	experience: number;
}

export interface PetData {
	_id?: string;
	type: PetType;
	name: string;
	parents: string[];
	needs: PetNeeds;
	isEgg: boolean;
	hatchTime?: Date;
	experience: number;
	level: number;
	background?: number | null;
	needsUpdatedAt?: Date;
	isOnExpedition: boolean;
	expeditionReturnTime?: Date;
}

export type PetUpdate = Partial<Omit<PetData, 'needs'>> & {
	needs?: Partial<PetNeeds>;
};

export type Pet = PetData & Database;

export type UserInventory = Record<string, number>;
