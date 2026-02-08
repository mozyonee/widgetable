import { Pet } from '@widgetable/types';
import { PET_MESSAGES, STAT_THRESHOLD } from './constants';

export function getPetMessage(pet: Pet): string {
	if (pet.needs.hygiene < STAT_THRESHOLD) return PET_MESSAGES.hygiene;
	if (pet.needs.toilet < STAT_THRESHOLD) return PET_MESSAGES.toilet;
	if (pet.needs.hunger < STAT_THRESHOLD) return PET_MESSAGES.hunger;
	if (pet.needs.thirst < STAT_THRESHOLD) return PET_MESSAGES.thirst;
	if (pet.needs.energy < STAT_THRESHOLD) return PET_MESSAGES.energy;
	return PET_MESSAGES.happy;
}

export function getParentId(parent: string | { _id: string }): string {
	return typeof parent === 'string' ? parent : parent._id;
}

export function getParentNames(pet: Pet, currentUserName?: string): string[] {
	return pet.parents
		.filter((parent: any) => typeof parent === 'object' && parent.name && parent.name !== currentUserName)
		.map((parent: any) => parent.name);
}
