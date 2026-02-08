import { Pet, PET_NEEDS_CONFIG, STAT_THRESHOLD, HAPPY_MESSAGE, PET_NEED_KEYS } from '@widgetable/types';

export function getPetMessage(pet: Pet): string {
	for (const needKey of PET_NEED_KEYS) {
		if (pet.needs[needKey] < STAT_THRESHOLD) {
			return PET_NEEDS_CONFIG[needKey].urgencyMessage;
		}
	}

	return HAPPY_MESSAGE;
}

export function getParentId(parent: string | { _id: string }): string {
	return typeof parent === 'string' ? parent : parent._id;
}

export function getParentNames(pet: Pet, currentUserName?: string): string[] {
	return pet.parents
		.filter((parent: any) => typeof parent === 'object' && parent.name && parent.name !== currentUserName)
		.map((parent: any) => parent.name);
}
