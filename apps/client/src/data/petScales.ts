import { PET_SCALES, PetType } from '@widgetable/types';

export const getPetScale = (petType: PetType | 'egg'): number => {
	return PET_SCALES[petType] ?? 1.0;
};
