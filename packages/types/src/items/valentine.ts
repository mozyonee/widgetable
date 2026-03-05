import { ItemTier } from './types';

export const VALENTINE_GIFT_ITEMS = [
	{ name: 'letterSealedRedHeart', tier: ItemTier.PREMIUM },
	{ name: 'letterSealedRedBorder', tier: ItemTier.COMMON },
	{ name: 'letterSealedPink', tier: ItemTier.BASIC },
	{ name: 'letterSealedSmallHeart', tier: ItemTier.COMMON },
	{ name: 'letterSealedOrange', tier: ItemTier.BASIC },
	{ name: 'letterSealedPinkHeart', tier: ItemTier.COMMON },
	{ name: 'letterSealedBrown', tier: ItemTier.BASIC },
	{ name: 'letterSealedAmber', tier: ItemTier.BASIC },
	{ name: 'envelopeWhite', tier: ItemTier.BASIC },
	{ name: 'envelopePink', tier: ItemTier.COMMON },
] as const;

export const VALENTINE_GIFT_ITEM_NAMES: string[] = VALENTINE_GIFT_ITEMS.map((item) => item.name);

export const isValentineGiftItem = (itemName: string): boolean => {
	return VALENTINE_GIFT_ITEM_NAMES.includes(itemName);
};
