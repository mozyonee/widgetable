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

export const PET_THRESHOLDS = {
	URGENT: 30,
	HIGH: 60,
} as const;

export const NOTIFICATION_CONFIG = {
	COOLDOWN_MS: 10 * 60 * 1000,
	DECAY_TIME_UNIT_MS: 60 * 1000,
	PET_NEEDS_COOLDOWN_MS: 3 * 60 * 60 * 1000,
} as const;

export const TIME_CONVERSION = {
	HOURS_TO_MS: (hours: number) => hours * 60 * 60 * 1000,
} as const;
