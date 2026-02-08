import { Database } from '../database';

// ============================================================================
// ENUMS
// ============================================================================

export enum PetType {
	FOX = 'fox',
	// CAT = 'cat',
	// DOG = 'dog',
	// RABBIT = 'rabbit',
}

export enum PetNeed {
	HUNGER = 'hunger',
	THIRST = 'thirst',
	ENERGY = 'energy',
	HYGIENE = 'hygiene',
	TOILET = 'toilet',
}

export enum PetActionCategory {
	FEED = 'Feed',
	DRINK = 'Drink',
	WASH = 'Wash',
	CARE = 'Care',
}

export enum PetAnimation {
	EAT = 'eat',
	DRINK = 'drink',
	TOILET = 'toilet',
	BATH = 'bath',
	SLEEP = 'sleep',
}

// ============================================================================
// NEEDS CONFIGURATION
// ============================================================================

export interface PetNeedConfig {
	label: string;
	decayRate: number; // How much this need decreases per 5-second interval
	urgencyMessage: string; // Message shown when need is below threshold
	category: PetActionCategory;
	animation: PetAnimation;
}

export const PET_NEEDS_CONFIG = {
	[PetNeed.HYGIENE]: {
		label: 'Hygiene',
		decayRate: 10.3,
		urgencyMessage: 'I need a bath!',
		category: PetActionCategory.WASH,
		animation: PetAnimation.BATH,
	},
	[PetNeed.TOILET]: {
		label: 'Toilet',
		decayRate: 10.2,
		urgencyMessage: 'I need to go to the toilet!',
		category: PetActionCategory.CARE,
		animation: PetAnimation.TOILET,
	},
	[PetNeed.HUNGER]: {
		label: 'Hunger',
		decayRate: 10,
		urgencyMessage: "I'm hungry!",
		category: PetActionCategory.FEED,
		animation: PetAnimation.EAT,
	},
	[PetNeed.THIRST]: {
		label: 'Thirst',
		decayRate: 10.2,
		urgencyMessage: "I'm thirsty!",
		category: PetActionCategory.DRINK,
		animation: PetAnimation.DRINK,
	},
	[PetNeed.ENERGY]: {
		label: 'Energy',
		decayRate: 10.5,
		urgencyMessage: "I'm tired!",
		category: PetActionCategory.CARE,
		animation: PetAnimation.SLEEP,
	},
} as const satisfies Record<string, PetNeedConfig>;

export type PetNeedKey = keyof typeof PET_NEEDS_CONFIG;
export const PET_NEED_KEYS = Object.keys(PET_NEEDS_CONFIG) as PetNeedKey[];
export type PetNeeds = Record<PetNeedKey, number>;

export const STAT_THRESHOLD = 30; // When a need drops below this value, show urgency message
export const HAPPY_MESSAGE = "I'm happy!";

// ============================================================================
// ACTIONS CONFIGURATION
// ============================================================================

export interface PetAction {
	name: string;
	needKey: PetNeedKey;
	value: number | 'increment';
	amount: number;
}

export const PET_ACTIONS_BY_CATEGORY = {
	[PetActionCategory.FEED]: [
		{ name: 'Meal', needKey: PetNeed.HUNGER, value: 100, amount: 100 },
		{ name: 'Snack', needKey: PetNeed.HUNGER, value: 'increment', amount: 30 },
	] as PetAction[],
	[PetActionCategory.DRINK]: [
		{ name: 'Water', needKey: PetNeed.THIRST, value: 100, amount: 100 },
		{ name: 'Juice', needKey: PetNeed.THIRST, value: 'increment', amount: 40 },
	] as PetAction[],
	[PetActionCategory.WASH]: [
		{ name: 'Bath', needKey: PetNeed.HYGIENE, value: 100, amount: 100 },
		{ name: 'Shower', needKey: PetNeed.HYGIENE, value: 'increment', amount: 50 },
	] as PetAction[],
	[PetActionCategory.CARE]: [
		{ name: 'Toilet', needKey: PetNeed.TOILET, value: 100, amount: 100 },
		{ name: 'Sleep', needKey: PetNeed.ENERGY, value: 100, amount: 100 },
	] as PetAction[],
};

// ============================================================================
// PET DATA TYPES
// ============================================================================

export interface PetData {
	type: PetType;
	name: string;
	parents: string[];
	needs: PetNeeds;
}

export type PetUpdate = Partial<Omit<PetData, 'needs'>> & {
	needs?: Partial<PetNeeds>;
};

export type Pet = PetData & Database;
