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
export const HAPPY_MESSAGES = [
	"I'm happy!",
	"Life is good!",
	"I'm feeling great!",
	"This is awesome!",
	"I love you!",
	"You're the best!",
	"I'm so content!",
	"Everything is perfect!",
];
export const HATCH_DURATION = 30 * 1000; // Time for egg to hatch in milliseconds (30 seconds)

// ============================================================================
// ACTIONS CONFIGURATION
// ============================================================================

export interface PetAction {
	name: string;
	needKey: PetNeedKey;
	value: number | 'increment';
	amount: number;
	inventoryCost?: number; // How many inventory items this action consumes (undefined = unlimited)
	experience: number;
}

export const PET_ACTIONS_BY_CATEGORY = {
	[PetActionCategory.FEED]: [
		{ name: 'Meal', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 1, experience: 15 },
		{ name: 'Snack', needKey: PetNeed.HUNGER, value: 'increment', amount: 30, inventoryCost: 1, experience: 8 },
	] as PetAction[],
	[PetActionCategory.DRINK]: [
		{ name: 'Water', needKey: PetNeed.THIRST, value: 100, amount: 100, inventoryCost: 1, experience: 15 },
		{ name: 'Juice', needKey: PetNeed.THIRST, value: 'increment', amount: 40, inventoryCost: 1, experience: 10 },
	] as PetAction[],
	[PetActionCategory.WASH]: [
		{ name: 'Bath', needKey: PetNeed.HYGIENE, value: 100, amount: 100, inventoryCost: 1, experience: 15 },
		{ name: 'Shower', needKey: PetNeed.HYGIENE, value: 'increment', amount: 50, inventoryCost: 1, experience: 10 },
	] as PetAction[],
	[PetActionCategory.CARE]: [
		{ name: 'Toilet', needKey: PetNeed.TOILET, value: 100, amount: 100, inventoryCost: 1, experience: 12 },
		{ name: 'Sleep', needKey: PetNeed.ENERGY, value: 100, amount: 100, experience: 5 },
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
	isEgg: boolean;
	hatchTime?: Date;
	experience: number;
	level: number;
}

export type PetUpdate = Partial<Omit<PetData, 'needs'>> & {
	needs?: Partial<PetNeeds>;
};

export type Pet = PetData & Database;

// ============================================================================
// LEVEL SYSTEM
// ============================================================================

const BASE_EXP = 50;
const EXP_MULTIPLIER = 1.5;

export const calculateLevel = (experience: number): number => {
	let level = 1;
	let expNeeded = BASE_EXP;
	let totalExpForLevel = 0;

	while (experience >= totalExpForLevel + expNeeded) {
		totalExpForLevel += expNeeded;
		level++;
		expNeeded = Math.floor(BASE_EXP * Math.pow(level, EXP_MULTIPLIER));
	}

	return level;
};

export const getExpForNextLevel = (level: number): number => {
	if (level === 1) return BASE_EXP;
	return Math.floor(BASE_EXP * Math.pow(level, EXP_MULTIPLIER));
};

export const getExpForCurrentLevel = (level: number): number => {
	if (level === 1) return 0;

	let totalExp = BASE_EXP;
	for (let i = 2; i < level; i++) {
		totalExp += Math.floor(BASE_EXP * Math.pow(i, EXP_MULTIPLIER));
	}
	return totalExp;
};

// ============================================================================
// INVENTORY CONFIGURATION
// ============================================================================

export type UserInventory = Record<string, number>;
