import { HAPPY_MESSAGES, Pet, PET_NEED_KEYS, PET_NEEDS_CONFIG, STAT_THRESHOLD } from '@widgetable/types';
import { USERNAME_INCLUSION_CHANCE } from './constants';


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
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

function addUsernameToMessage(message: string, username: string | undefined, seed: number): string {
	if (!username || seed % 100 >= USERNAME_INCLUSION_CHANCE * 100) {
		return message;
	}

	const variations = [
		`Hey ${username}, ${message.toLowerCase()}`,
		`${username}, ${message.toLowerCase()}`,
		`${message.replace("!", ",")} ${username}!`,
		`${username}! ${message}`,
	];

	return variations[seed % variations.length];
}

export function getPetMessage(pet: Pet, username?: string): string {
	const seed = getPetStateSeed(pet);

	for (const needKey of PET_NEED_KEYS) {
		if (pet.needs[needKey] < STAT_THRESHOLD) {
			const message = PET_NEEDS_CONFIG[needKey].urgencyMessage;
			return addUsernameToMessage(message, username, seed);
		}
	}

	const happyMessage = HAPPY_MESSAGES[seed % HAPPY_MESSAGES.length];
	return addUsernameToMessage(happyMessage, username, seed);
}

export function getParentId(parent: string | { _id: string }): string {
	return typeof parent === 'string' ? parent : parent._id;
}

export function getParentNames(pet: Pet, currentUserName?: string): string[] {
	return pet.parents
		.filter((parent: any) => typeof parent === 'object' && parent.name && parent.name !== currentUserName)
		.map((parent: any) => parent.name);
}
