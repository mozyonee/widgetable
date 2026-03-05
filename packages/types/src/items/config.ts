export enum ClaimType {
	DAILY = 'daily',
	QUICK = 'quick',
}

export const CLAIM_TYPE_CONFIG: Record<ClaimType, { cooldownHours: number; multiplier: number }> = {
	[ClaimType.DAILY]: { cooldownHours: 24, multiplier: 1.0 },
	[ClaimType.QUICK]: { cooldownHours: 4, multiplier: 0.4 },
};

export const isClaimAvailable = (lastClaimTime: Date | undefined, cooldownHours: number, now: Date): boolean => {
	if (!lastClaimTime) return true;
	return now.getTime() - lastClaimTime.getTime() >= cooldownHours * 60 * 60 * 1000;
};

export const getNextClaimTime = (lastClaimTime: Date, cooldownHours: number): Date => {
	return new Date(lastClaimTime.getTime() + cooldownHours * 60 * 60 * 1000);
};

export const ITEMS_CLAIM_CONFIG = {
	BASE_FOOD_ITEMS: 3,
	BASE_DRINK_ITEMS: 4,
	BASE_HYGIENE_ITEMS: 2,
	BASE_CARE_ITEMS: 4,
	BASE_EGG_CHANCE: 0.35,
	// Controls how fast egg chance decays as pet count grows: 1 + petCount * decay
	EGG_CHANCE_PET_DECAY: 0.6,
	MIN_EGG_CHANCE: 0.05,
} as const;

export const EXPEDITION_CONFIG = {
	BASE_FOOD_ITEMS: 3,
	BASE_DRINK_ITEMS: 4,
	BASE_HYGIENE_ITEMS: 2,
	BASE_CARE_ITEMS: 4,
	MIN_EGG_CHANCE: 0.05,
	MAX_EGG_CHANCE: 0.18,
	// Per-level bonus rate applied to item counts (caps at LEVEL_ITEM_CAP)
	LEVEL_ITEM_RATE: 0.1,
	LEVEL_ITEM_CAP: 1.0,
	// Logarithmic growth coefficient for expedition egg chance
	EGG_CHANCE_LEVEL_GROWTH: 0.3,
} as const;
