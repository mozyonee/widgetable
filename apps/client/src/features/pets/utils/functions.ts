import { Pet, PET_NEED_KEYS, PET_THRESHOLDS, TFunction, USERNAME_INCLUSION_CHANCE } from '@widgetable/types';

// Sums pet needs in 10-point buckets and incorporates pet ID to create a stable, pet-specific seed
function getPetStateSeed(pet: Pet): number {
	const stateSeed = PET_NEED_KEYS.reduce((seed, key) => seed + Math.floor(pet.needs[key] / 10) * 10, 0);
	const petIdHash = pet._id ? hashString(pet._id) : 0;
	return stateSeed + petIdHash;
}

// Simple string hash function for consistent pet-specific seeding
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

function addUsernameToMessage(message: string, username: string | undefined, seed: number, t: TFunction): string {
	if (!username || seed % 100 >= USERNAME_INCLUSION_CHANCE * 100) {
		return message;
	}

	return t(`pets.usernameVariation.${seed % 4}`, { username, message: message.toLowerCase() });
}

export function getPetMessage(pet: Pet, username: string | undefined, t: TFunction): string {
	const seed = getPetStateSeed(pet);

	for (const needKey of PET_NEED_KEYS) {
		if (pet.needs[needKey] < PET_THRESHOLDS.URGENT) {
			const message = t('pets.needs.urgency.' + needKey);
			return addUsernameToMessage(message, username, seed, t);
		}
	}

	const happyMessage = t('pets.happy.' + (seed % 8));
	return addUsernameToMessage(happyMessage, username, seed, t);
}

export function getParentId(parent: string | { _id: string }): string {
	return typeof parent === 'string' ? parent : parent._id;
}

export function getParentNames(pet: Pet, currentUserName?: string): string[] {
	return pet.parents
		.filter((parent: any) => typeof parent === 'object' && parent.name && parent.name !== currentUserName)
		.map((parent: any) => parent.name);
}
