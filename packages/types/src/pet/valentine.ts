import { ItemTier } from '../rewards';

export const VALENTINE_GIFT_ITEMS = [
	{ name: 'Letter Sealed Red Heart', tier: ItemTier.PREMIUM },
	{ name: 'Letter Sealed Red Border', tier: ItemTier.COMMON },
	{ name: 'Letter Sealed Pink', tier: ItemTier.BASIC },
	{ name: 'Letter Sealed Small Heart', tier: ItemTier.COMMON },
	{ name: 'Letter Sealed Orange', tier: ItemTier.BASIC },
	{ name: 'Letter Sealed Pink Heart', tier: ItemTier.COMMON },
	{ name: 'Letter Sealed Brown', tier: ItemTier.BASIC },
	{ name: 'Letter Sealed Amber', tier: ItemTier.BASIC },
	{ name: 'Envelope White', tier: ItemTier.BASIC },
	{ name: 'Envelope Pink', tier: ItemTier.COMMON },
] as const;

export const VALENTINE_GIFT_ITEM_NAMES: string[] = VALENTINE_GIFT_ITEMS.map((item) => item.name);

export const isValentineGiftItem = (itemName: string): boolean => {
	return VALENTINE_GIFT_ITEM_NAMES.includes(itemName);
};
