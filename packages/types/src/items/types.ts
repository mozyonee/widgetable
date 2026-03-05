export enum ItemTier {
	BASIC = 1,
	COMMON = 2,
	PREMIUM = 3,
	LEGENDARY = 4,
}

export const getItemTier = (amount: number): ItemTier => {
	if (amount >= 100) return ItemTier.LEGENDARY;
	if (amount >= 75) return ItemTier.PREMIUM;
	if (amount >= 50) return ItemTier.COMMON;
	return ItemTier.BASIC;
};

export interface ItemReward {
	name: string;
	quantity: number;
}

import { ClaimType } from './config';

export interface ItemStatus {
	available: Record<ClaimType, boolean>;
	nextClaimTime: Partial<Record<ClaimType, Date>>;
	petCount: number;
}

export interface ItemBundle {
	food: ItemReward[];
	drinks: ItemReward[];
	hygiene: ItemReward[];
	care: ItemReward[];
	eggs: number;
	valentines?: ItemReward[];
}

export interface ItemResult {
	success: boolean;
	items: ItemBundle;
	totalItems: number;
}
