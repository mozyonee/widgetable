import { PetActionCategory, PetAnimation, PetNeed, PetType } from './enums';
import { PetNeedConfig } from './types';

export const ANIMATION_DURATIONS: Record<PetAnimation, number> = {
	[PetAnimation.EAT]: 4500,
	[PetAnimation.DRINK]: 3750,
	[PetAnimation.TOILET]: 6000,
	[PetAnimation.BATH]: 6000,
	[PetAnimation.SLEEP]: 18000,
};

export const PET_SCALES: Record<PetType | 'egg', number> = {
	egg: 0.8,
	[PetType.FOX]: 1.4,
	[PetType.CAT]: 1.0,
	[PetType.DOG]: 1.3,
	[PetType.BUNNY]: 1.1,
	[PetType.CHICKEN]: 0.7,
	[PetType.PANDA]: 1.0,
	[PetType.TURTLE]: 1.0,
	[PetType.PARROT]: 0.95,
};

export const getPetScale = (petType: PetType | 'egg'): number => {
	return PET_SCALES[petType] ?? 1.0;
};

export const PET_NEEDS_CONFIG = {
	[PetNeed.HYGIENE]: {
		decayDuration: 6 * 60 * 60 * 1000,
		urgencyMessage: 'I need a bath!',
		category: PetActionCategory.WASH,
		animation: PetAnimation.BATH,
	},
	[PetNeed.TOILET]: {
		decayDuration: 3 * 60 * 60 * 1000,
		urgencyMessage: 'I need to go to the toilet!',
		category: PetActionCategory.CARE,
		animation: PetAnimation.TOILET,
	},
	[PetNeed.HUNGER]: {
		decayDuration: 4 * 60 * 60 * 1000,
		urgencyMessage: "I'm hungry!",
		category: PetActionCategory.FEED,
		animation: PetAnimation.EAT,
	},
	[PetNeed.THIRST]: {
		decayDuration: 2 * 60 * 60 * 1000,
		urgencyMessage: "I'm thirsty!",
		category: PetActionCategory.DRINK,
		animation: PetAnimation.DRINK,
	},
	[PetNeed.ENERGY]: {
		decayDuration: 5 * 60 * 60 * 1000,
		urgencyMessage: "I'm tired!",
		category: PetActionCategory.CARE,
		animation: PetAnimation.SLEEP,
	},
} as const satisfies Record<string, PetNeedConfig>;

export const PET_NEED_KEYS = Object.keys(PET_NEEDS_CONFIG) as (keyof typeof PET_NEEDS_CONFIG)[];
