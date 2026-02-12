import { Database } from '../database';

// ============================================================================
// ENUMS
// ============================================================================

export enum PetType {
	FOX = 'fox',
	CAT = 'cat',
	DOG = 'dog',
	BUNNY = 'bunny',
	CHICKEN = 'chicken',
	PANDA = 'panda',
	TURTLE = 'turtle',
	PARROT = 'parrot',
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

// Animation durations in milliseconds
export const ANIMATION_DURATIONS: Record<PetAnimation, number> = {
	[PetAnimation.EAT]: 4500,
	[PetAnimation.DRINK]: 3750,
	[PetAnimation.TOILET]: 6000,
	[PetAnimation.BATH]: 6000,
	[PetAnimation.SLEEP]: 18000,
};

// ============================================================================
// NEEDS CONFIGURATION
// ============================================================================

export interface PetNeedConfig {
	label: string;
	decayRate: number; // How much this need decreases per DECAY_TIME_UNIT
	urgencyMessage: string; // Message shown when need is below threshold
	category: PetActionCategory;
	animation: PetAnimation;
}

export const PET_NEEDS_CONFIG = {
	[PetNeed.HYGIENE]: {
		label: 'Hygiene',
		decayRate: 0.28, // depletes in ~6 hours
		urgencyMessage: 'I need a bath!',
		category: PetActionCategory.WASH,
		animation: PetAnimation.BATH,
	},
	[PetNeed.TOILET]: {
		label: 'Toilet',
		decayRate: 0.56, // depletes in ~3 hours
		urgencyMessage: 'I need to go to the toilet!',
		category: PetActionCategory.CARE,
		animation: PetAnimation.TOILET,
	},
	[PetNeed.HUNGER]: {
		label: 'Hunger',
		decayRate: 0.42, // depletes in ~4 hours
		urgencyMessage: "I'm hungry!",
		category: PetActionCategory.FEED,
		animation: PetAnimation.EAT,
	},
	[PetNeed.THIRST]: {
		label: 'Thirst',
		decayRate: 0.83, // depletes in ~2 hours
		urgencyMessage: "I'm thirsty!",
		category: PetActionCategory.DRINK,
		animation: PetAnimation.DRINK,
	},
	[PetNeed.ENERGY]: {
		label: 'Energy',
		decayRate: 0.33, // depletes in ~5 hours
		urgencyMessage: "I'm tired!",
		category: PetActionCategory.CARE,
		animation: PetAnimation.SLEEP,
	},
} as const satisfies Record<string, PetNeedConfig>;

export type PetNeedKey = keyof typeof PET_NEEDS_CONFIG;
export const PET_NEED_KEYS = Object.keys(PET_NEEDS_CONFIG) as PetNeedKey[];
export type PetNeeds = Record<PetNeedKey, number>;

export const HATCH_DURATION = 30 * 1000; // Time for egg to hatch in milliseconds (30 seconds)
export const PET_UPDATE_INTERVAL = 5 * 1000; // How often to update pet stats (5 seconds)
export const STAT_THRESHOLD = 30; // When a need drops below this value, show urgency message
export const USERNAME_INCLUSION_CHANCE = 0.3;
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
		// Full restore - premium foods
		{ name: 'Sushi', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 4, experience: 30 },
		{ name: 'Hamburger', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 4, experience: 30 },
		{ name: 'Lasagna', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 4, experience: 30 },

		// High restore - main meals
		{ name: 'Bento Box', needKey: PetNeed.HUNGER, value: 'increment', amount: 70, inventoryCost: 3, experience: 20 },
		{ name: 'Pizza', needKey: PetNeed.HUNGER, value: 'increment', amount: 65, inventoryCost: 2, experience: 18 },
		{ name: 'Ramen', needKey: PetNeed.HUNGER, value: 'increment', amount: 68, inventoryCost: 2, experience: 19 },
		{ name: 'Taco', needKey: PetNeed.HUNGER, value: 'increment', amount: 62, inventoryCost: 2, experience: 17 },
		{ name: 'Burrito', needKey: PetNeed.HUNGER, value: 'increment', amount: 65, inventoryCost: 2, experience: 18 },

		// Moderate restore - light meals
		{ name: 'Sandwich', needKey: PetNeed.HUNGER, value: 'increment', amount: 50, inventoryCost: 1, experience: 13 },
		{ name: 'Hot Dog', needKey: PetNeed.HUNGER, value: 'increment', amount: 48, inventoryCost: 1, experience: 12 },
		{ name: 'Soup', needKey: PetNeed.HUNGER, value: 'increment', amount: 45, inventoryCost: 1, experience: 11 },
		{ name: 'Rice Bowl', needKey: PetNeed.HUNGER, value: 'increment', amount: 47, inventoryCost: 1, experience: 12 },
		{ name: 'Mac & Cheese', needKey: PetNeed.HUNGER, value: 'increment', amount: 52, inventoryCost: 1, experience: 13 },

		// Small restore - snacks
		{ name: 'Watermelon', needKey: PetNeed.HUNGER, value: 'increment', amount: 25, inventoryCost: 1, experience: 6 },
		{ name: 'Mango', needKey: PetNeed.HUNGER, value: 'increment', amount: 22, inventoryCost: 1, experience: 5 },
		{ name: 'Strawberry', needKey: PetNeed.HUNGER, value: 'increment', amount: 20, inventoryCost: 1, experience: 5 },
		{ name: 'Cookie', needKey: PetNeed.HUNGER, value: 'increment', amount: 20, inventoryCost: 1, experience: 5 },
		{ name: 'Brownie', needKey: PetNeed.HUNGER, value: 'increment', amount: 22, inventoryCost: 1, experience: 5 },
		{ name: 'Donut', needKey: PetNeed.HUNGER, value: 'increment', amount: 18, inventoryCost: 1, experience: 4 },
		{ name: 'French Fries', needKey: PetNeed.HUNGER, value: 'increment', amount: 18, inventoryCost: 1, experience: 4 },
	] as PetAction[],
	[PetActionCategory.DRINK]: [
		// Full restore
		{ name: 'Orange Juice', needKey: PetNeed.THIRST, value: 100, amount: 100, inventoryCost: 2, experience: 20 },
		{ name: 'Apple Cider', needKey: PetNeed.THIRST, value: 100, amount: 100, inventoryCost: 3, experience: 25 },
		{ name: 'Fruit Parfait', needKey: PetNeed.THIRST, value: 100, amount: 100, inventoryCost: 3, experience: 25 },

		// High restore
		{ name: 'Latte', needKey: PetNeed.THIRST, value: 'increment', amount: 65, inventoryCost: 2, experience: 16 },
		{ name: 'Milk', needKey: PetNeed.THIRST, value: 'increment', amount: 55, inventoryCost: 1, experience: 14 },

		// Moderate restore
		{ name: 'Hot Cocoa', needKey: PetNeed.THIRST, value: 'increment', amount: 40, inventoryCost: 1, experience: 8 },
		{ name: 'Fruit Tea', needKey: PetNeed.THIRST, value: 'increment', amount: 50, inventoryCost: 1, experience: 10 },

		// Small restore
		{ name: 'Cappuccino', needKey: PetNeed.THIRST, value: 'increment', amount: 30, inventoryCost: 1, experience: 7 },
	] as PetAction[],
	[PetActionCategory.WASH]: [
		// Full restore - premium cleaning
		{ name: 'Bath Salts', needKey: PetNeed.HYGIENE, value: 100, amount: 100, inventoryCost: 4, experience: 35 },
		{ name: 'Bathtub', needKey: PetNeed.HYGIENE, value: 100, amount: 100, inventoryCost: 3, experience: 28 },

		// High restore
		{ name: 'Shampoo', needKey: PetNeed.HYGIENE, value: 'increment', amount: 80, inventoryCost: 2, experience: 22 },
		{ name: 'Shower', needKey: PetNeed.HYGIENE, value: 'increment', amount: 70, inventoryCost: 2, experience: 18 },

		// Moderate restore
		{ name: 'Mouth Wash', needKey: PetNeed.HYGIENE, value: 'increment', amount: 50, inventoryCost: 1, experience: 12 },
		{ name: 'Hand Soap', needKey: PetNeed.HYGIENE, value: 'increment', amount: 40, inventoryCost: 1, experience: 10 },
		{ name: 'Brush', needKey: PetNeed.HYGIENE, value: 'increment', amount: 45, inventoryCost: 1, experience: 11 },

		// Small restore
		{ name: 'Wipe Down', needKey: PetNeed.HYGIENE, value: 'increment', amount: 25, inventoryCost: 1, experience: 6 },
		{ name: 'Sponge', needKey: PetNeed.HYGIENE, value: 'increment', amount: 30, inventoryCost: 1, experience: 7 },
	] as PetAction[],
	[PetActionCategory.CARE]: [
		// Toilet actions
		{ name: 'Toilet', needKey: PetNeed.TOILET, value: 100, amount: 100, inventoryCost: 1, experience: 15 },
		{ name: 'Quick Potty', needKey: PetNeed.TOILET, value: 'increment', amount: 60, inventoryCost: 1, experience: 10 },

		// Energy/rest actions
		{ name: 'Long Sleep', needKey: PetNeed.ENERGY, value: 100, amount: 100, experience: 12 },
		{ name: 'Nap', needKey: PetNeed.ENERGY, value: 'increment', amount: 50, experience: 6 },
		{ name: 'Rest', needKey: PetNeed.ENERGY, value: 'increment', amount: 35, experience: 4 },

		// Grooming/care actions
		{ name: 'Grooming Session', needKey: PetNeed.HYGIENE, value: 'increment', amount: 55, inventoryCost: 2, experience: 16 },
		{ name: 'Nail Trim', needKey: PetNeed.HYGIENE, value: 'increment', amount: 20, inventoryCost: 1, experience: 8 },
		{ name: 'Ear Cleaning', needKey: PetNeed.HYGIENE, value: 'increment', amount: 25, inventoryCost: 1, experience: 9 },
	] as PetAction[],
};

// ============================================================================
// PET DATA TYPES
// ============================================================================

export enum ItemTier {
	BASIC = 1,
	COMMON = 2,
	PREMIUM = 3,
	LEGENDARY = 4,
}

export interface ItemReward {
	name: string;
	quantity: number;
	tier: ItemTier;
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

export const EGG_ITEM_NAME = 'Egg';

export type UserInventory = Record<string, number>;

// ============================================================================
// EXPEDITION CONFIGURATION
// ============================================================================

export const EXPEDITION_BASE_DURATION = 60 * 60 * 1000; // 1 hour
export const EXPEDITION_LEVEL_MULTIPLIER = 0.1; // +10% per level