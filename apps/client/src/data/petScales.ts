import { PetType } from '@widgetable/types';

/**
 * Scale factors for each pet type to normalize their sizes
 * Adjust these values to make pets appear similar in size
 * 1.0 = no scaling, <1.0 = smaller, >1.0 = larger
 */
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
