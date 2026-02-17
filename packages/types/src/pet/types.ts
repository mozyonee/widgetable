import { Database } from '../database';
import { ItemReward } from '../rewards';
import { PetActionCategory, PetAnimation, PetNeed, PetType } from './enums';

export interface PetNeedConfig {
	label: string;
	decayRate: number;
	urgencyMessage: string;
	category: PetActionCategory;
	animation: PetAnimation;
}

export type PetNeedKey = PetNeed;
export type PetNeeds = Record<PetNeedKey, number>;

export interface PetAction {
	name: string;
	needKey: PetNeedKey;
	value: number | 'increment';
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
	isOnExpedition: boolean;
	expeditionReturnTime?: Date;
	expeditionRewards?: {
		food: ItemReward[];
		drinks: ItemReward[];
		hygiene: ItemReward[];
		eggs: number;
	};
}

export type PetUpdate = Partial<Omit<PetData, 'needs'>> & {
	needs?: Partial<PetNeeds>;
};

export type Pet = PetData & Database;

export type UserInventory = Record<string, number>;
