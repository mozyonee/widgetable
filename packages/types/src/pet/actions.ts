import { PetActionCategory, PetNeed } from './enums';
import { PetAction } from './types';

export const PET_ACTIONS_BY_CATEGORY = {
	[PetActionCategory.FEED]: [
		// Full restore - premium foods
		{ name: 'Sushi', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 4, experience: 30 },
		{ name: 'Hamburger', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 4, experience: 30 },
		{ name: 'Lasagna', needKey: PetNeed.HUNGER, value: 100, amount: 100, inventoryCost: 4, experience: 30 },

		// High restore - main meals
		{
			name: 'Bento Box',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 70,
			inventoryCost: 3,
			experience: 20,
		},
		{ name: 'Pizza', needKey: PetNeed.HUNGER, value: 'increment', amount: 65, inventoryCost: 2, experience: 18 },
		{ name: 'Ramen', needKey: PetNeed.HUNGER, value: 'increment', amount: 68, inventoryCost: 2, experience: 19 },
		{ name: 'Taco', needKey: PetNeed.HUNGER, value: 'increment', amount: 62, inventoryCost: 2, experience: 17 },
		{ name: 'Burrito', needKey: PetNeed.HUNGER, value: 'increment', amount: 65, inventoryCost: 2, experience: 18 },

		// Moderate restore - light meals
		{ name: 'Sandwich', needKey: PetNeed.HUNGER, value: 'increment', amount: 50, inventoryCost: 1, experience: 13 },
		{ name: 'Hot Dog', needKey: PetNeed.HUNGER, value: 'increment', amount: 48, inventoryCost: 1, experience: 12 },
		{ name: 'Soup', needKey: PetNeed.HUNGER, value: 'increment', amount: 45, inventoryCost: 1, experience: 11 },
		{
			name: 'Rice Bowl',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 47,
			inventoryCost: 1,
			experience: 12,
		},
		{
			name: 'Mac & Cheese',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 52,
			inventoryCost: 1,
			experience: 13,
		},

		// Small restore - snacks
		{
			name: 'Watermelon',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 25,
			inventoryCost: 1,
			experience: 6,
		},
		{ name: 'Mango', needKey: PetNeed.HUNGER, value: 'increment', amount: 22, inventoryCost: 1, experience: 5 },
		{
			name: 'Strawberry',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 20,
			inventoryCost: 1,
			experience: 5,
		},
		{ name: 'Cookie', needKey: PetNeed.HUNGER, value: 'increment', amount: 20, inventoryCost: 1, experience: 5 },
		{ name: 'Brownie', needKey: PetNeed.HUNGER, value: 'increment', amount: 22, inventoryCost: 1, experience: 5 },
		{ name: 'Donut', needKey: PetNeed.HUNGER, value: 'increment', amount: 18, inventoryCost: 1, experience: 4 },
		{
			name: 'French Fries',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 18,
			inventoryCost: 1,
			experience: 4,
		},
		{
			name: 'Chocolate Bar Brown',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 30,
			inventoryCost: 1,
			experience: 8,
		},
		{
			name: 'Chocolate Bar White',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 30,
			inventoryCost: 1,
			experience: 8,
		},
		{
			name: 'Chocolate Bar Red',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 35,
			inventoryCost: 2,
			experience: 10,
		},
		{
			name: 'Chocolate Bar Blue',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 35,
			inventoryCost: 2,
			experience: 10,
		},
		{
			name: 'Chocolate Bar Duo',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 40,
			inventoryCost: 2,
			experience: 12,
		},
		{
			name: 'Chocolate',
			needKey: PetNeed.HUNGER,
			value: 'increment',
			amount: 45,
			inventoryCost: 3,
			experience: 15,
		},
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
		{
			name: 'Fruit Tea',
			needKey: PetNeed.THIRST,
			value: 'increment',
			amount: 50,
			inventoryCost: 1,
			experience: 10,
		},

		// Small restore
		{
			name: 'Cappuccino',
			needKey: PetNeed.THIRST,
			value: 'increment',
			amount: 30,
			inventoryCost: 1,
			experience: 7,
		},
	] as PetAction[],
	[PetActionCategory.WASH]: [
		// Full restore - premium cleaning
		{ name: 'Bath Salts', needKey: PetNeed.HYGIENE, value: 100, amount: 100, inventoryCost: 4, experience: 35 },
		{ name: 'Bathtub', needKey: PetNeed.HYGIENE, value: 100, amount: 100, inventoryCost: 3, experience: 28 },

		// High restore
		{ name: 'Shampoo', needKey: PetNeed.HYGIENE, value: 'increment', amount: 80, inventoryCost: 2, experience: 22 },
		{ name: 'Shower', needKey: PetNeed.HYGIENE, value: 'increment', amount: 70, inventoryCost: 2, experience: 18 },

		// Moderate restore
		{
			name: 'Grooming Session',
			needKey: PetNeed.HYGIENE,
			value: 'increment',
			amount: 55,
			inventoryCost: 2,
			experience: 16,
		},
		{
			name: 'Mouth Wash',
			needKey: PetNeed.HYGIENE,
			value: 'increment',
			amount: 50,
			inventoryCost: 1,
			experience: 12,
		},
		{
			name: 'Hand Soap',
			needKey: PetNeed.HYGIENE,
			value: 'increment',
			amount: 40,
			inventoryCost: 1,
			experience: 10,
		},
		{ name: 'Brush', needKey: PetNeed.HYGIENE, value: 'increment', amount: 45, inventoryCost: 1, experience: 11 },
		// Small restore
		{
			name: 'Wipe Down',
			needKey: PetNeed.HYGIENE,
			value: 'increment',
			amount: 25,
			inventoryCost: 1,
			experience: 6,
		},
		{ name: 'Sponge', needKey: PetNeed.HYGIENE, value: 'increment', amount: 30, inventoryCost: 1, experience: 7 },
		,
		{
			name: 'Ear Cleaning',
			needKey: PetNeed.HYGIENE,
			value: 'increment',
			amount: 25,
			inventoryCost: 1,
			experience: 9,
		},
		{
			name: 'Nail Trim',
			needKey: PetNeed.HYGIENE,
			value: 'increment',
			amount: 20,
			inventoryCost: 1,
			experience: 8,
		},
	] as PetAction[],
	[PetActionCategory.CARE]: [
		{ name: 'Toilet', needKey: PetNeed.TOILET, value: 100, amount: 100, inventoryCost: 1, experience: 15 },
		{
			name: 'Quick Potty',
			needKey: PetNeed.TOILET,
			value: 'increment',
			amount: 60,
			inventoryCost: 1,
			experience: 10,
		},
		{ name: 'Long Sleep', needKey: PetNeed.ENERGY, value: 100, amount: 100, experience: 12 },
		{ name: 'Nap', needKey: PetNeed.ENERGY, value: 'increment', amount: 50, experience: 6 },
		{ name: 'Rest', needKey: PetNeed.ENERGY, value: 'increment', amount: 35, experience: 4 },
	] as PetAction[],
};
