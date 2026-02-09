import { HAPPY_MESSAGES, Pet, PET_NEED_KEYS, PET_NEEDS_CONFIG, STAT_THRESHOLD } from '@widgetable/types';

const USERNAME_INCLUSION_CHANCE = 0.2;

// Sums pet needs in 10-point buckets to create a stable value for deterministic message/variation selection
function getPetStateSeed(pet: Pet): number {
	return PET_NEED_KEYS.reduce((seed, key) => seed + Math.floor(pet.needs[key] / 10) * 10, 0);
}

function addUsernameToMessage(message: string, username: string | undefined, seed: number): string {
	if (!username || seed % 100 >= USERNAME_INCLUSION_CHANCE * 100) {
		return message;
	}

	const variations = [
		`Hey ${username}, ${message.toLowerCase()}`,
		`${username}, ${message.toLowerCase()}`,
		`${message} ${username}!`,
		`${username}! ${message}`,
	];

	return variations[seed % variations.length];
}

export function getPetMessage(pet: Pet, username?: string): string {
	const seed = getPetStateSeed(pet);

	for (const needKey of PET_NEED_KEYS) {
		if (pet.needs[needKey] < STAT_THRESHOLD) {
			return addUsernameToMessage(PET_NEEDS_CONFIG[needKey].urgencyMessage, username, seed);
		}
	}

	return addUsernameToMessage(HAPPY_MESSAGES[seed % HAPPY_MESSAGES.length], username, seed);
}

export function getParentId(parent: string | { _id: string }): string {
	return typeof parent === 'string' ? parent : parent._id;
}

export function getParentNames(pet: Pet, currentUserName?: string): string[] {
	return pet.parents
		.filter((parent: any) => typeof parent === 'object' && parent.name && parent.name !== currentUserName)
		.map((parent: any) => parent.name);
}
