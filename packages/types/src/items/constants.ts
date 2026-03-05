import { ItemTier } from './types';

export const TIER_WEIGHTS = {
	[ItemTier.BASIC]: 60,
	[ItemTier.COMMON]: 25,
	[ItemTier.PREMIUM]: 10,
	[ItemTier.LEGENDARY]: 5,
} as const;

export const ITEMS_CONFIG = {
	MAX_DUPLICATE_ITEMS: 2,
} as const;
