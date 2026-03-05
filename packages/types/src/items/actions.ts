import { PetActionCategory, PetNeed } from '../pet/enums';
import { PetAction } from '../pet/types';

export const PET_ACTIONS_BY_CATEGORY = {
	[PetActionCategory.FEED]: [
		// Full restore - premium foods
		{ name: 'sushi', needKey: PetNeed.HUNGER, amount: 100, inventoryCost: 1, experience: 18 },
		{ name: 'hamburger', needKey: PetNeed.HUNGER, amount: 100, inventoryCost: 1, experience: 18 },

		// High restore - main meals
		{ name: 'pizza', needKey: PetNeed.HUNGER, amount: 75, inventoryCost: 1, experience: 13 },
		{ name: 'chocolateBar', needKey: PetNeed.HUNGER, amount: 18, inventoryCost: 1, experience: 8 },

		// Small restore - snacks
		{ name: 'cookie', needKey: PetNeed.HUNGER, amount: 50, inventoryCost: 1, experience: 4 },
		{ name: 'donut', needKey: PetNeed.HUNGER, amount: 55, inventoryCost: 1, experience: 3 },
		{ name: 'watermelon', needKey: PetNeed.HUNGER, amount: 22, inventoryCost: 1, experience: 5 },
		{ name: 'mango', needKey: PetNeed.HUNGER, amount: 50, inventoryCost: 1, experience: 4 },
		{ name: 'strawberry', needKey: PetNeed.HUNGER, amount: 20, inventoryCost: 1, experience: 4 },
	] as PetAction[],
	[PetActionCategory.DRINK]: [
		// Full restore
		{ name: 'orangeJuice', needKey: PetNeed.THIRST, amount: 55, inventoryCost: 1, experience: 12 },
		{ name: 'fruitTea', needKey: PetNeed.THIRST, amount: 100, inventoryCost: 1, experience: 7 },

		// High restore
		{ name: 'appleCider', needKey: PetNeed.THIRST, amount: 45, inventoryCost: 1, experience: 14 },
		{ name: 'latte', needKey: PetNeed.THIRST, amount: 65, inventoryCost: 1, experience: 9 },

		// Moderate restore
		{ name: 'hotCocoa', needKey: PetNeed.THIRST, amount: 75, inventoryCost: 1, experience: 6 },
		{ name: 'milk', needKey: PetNeed.THIRST, amount: 40, inventoryCost: 1, experience: 8 },
	] as PetAction[],
	[PetActionCategory.WASH]: [
		// Full restore - premium cleaning
		{ name: 'bathtub', needKey: PetNeed.HYGIENE, amount: 100, inventoryCost: 1, experience: 16 },
		{ name: 'shower', needKey: PetNeed.HYGIENE, amount: 75, inventoryCost: 1, experience: 14 },

		// Moderate restore
		{ name: 'handSoap', needKey: PetNeed.HYGIENE, amount: 50, inventoryCost: 1, experience: 8 },
		{ name: 'brush', needKey: PetNeed.HYGIENE, amount: 50, inventoryCost: 1, experience: 9 },

		// Small restore
		{ name: 'earCleaning', needKey: PetNeed.HYGIENE, amount: 35, inventoryCost: 1, experience: 5 },
		{ name: 'nailTrim', needKey: PetNeed.HYGIENE, amount: 25, inventoryCost: 1, experience: 4 },
	] as PetAction[],
	[PetActionCategory.CARE]: [
		{ name: 'toilet', needKey: PetNeed.TOILET, amount: 100, inventoryCost: 1, experience: 15 },
		{ name: 'quickPotty', needKey: PetNeed.TOILET, amount: 60, inventoryCost: 1, experience: 10 },
		{ name: 'longSleep', needKey: PetNeed.ENERGY, amount: 100, inventoryCost: 1, experience: 12 },
		{ name: 'nap', needKey: PetNeed.ENERGY, amount: 50, inventoryCost: 1, experience: 6 },
		{ name: 'rest', needKey: PetNeed.ENERGY, amount: 35, inventoryCost: 1, experience: 4 },
	] as PetAction[],
};

export const ACTION_AMOUNT_BY_NAME: Record<string, number> = Object.values(PET_ACTIONS_BY_CATEGORY)
	.flat()
	.reduce((acc, action) => ({ ...acc, [action.name]: action.amount }), {});
