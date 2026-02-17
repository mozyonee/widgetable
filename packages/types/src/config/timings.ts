export const HATCH_DURATIONS = [
	30 * 1000,
	5 * 60 * 1000,
	30 * 60 * 1000,
	60 * 60 * 1000,
	2 * 60 * 60 * 1000,
	4 * 60 * 60 * 1000,
	8 * 60 * 60 * 1000,
	16 * 60 * 60 * 1000,
] as const;

export const CLAIMS_CONFIG = {
	DAILY_COOLDOWN_HOURS: 24,
	QUICK_COOLDOWN_HOURS: 4,
	QUICK_REWARD_MULTIPLIER: 0.4,
	BASE_FOOD_ITEMS: 6,
	BASE_DRINK_ITEMS: 6,
	BASE_HYGIENE_ITEMS: 4,
	BASE_CARE_ITEMS: 4,
	BASE_EGG_CHANCE: 0.35,
} as const;

export const NOTIFICATION_CONFIG = {
	COOLDOWN_MS: 10 * 60 * 1000,
	DECAY_TIME_UNIT_MS: 60 * 1000,
} as const;

export const TIME_CONVERSION = {
	HOURS_TO_MS: (hours: number) => hours * 60 * 60 * 1000,
} as const;