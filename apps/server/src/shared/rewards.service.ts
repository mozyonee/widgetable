import { Injectable } from '@nestjs/common';
import {
	ItemReward,
	ItemTier,
	PET_ACTIONS_BY_CATEGORY,
	PetAction,
	PetActionCategory,
	REWARDS_CONFIG,
	TIER_WEIGHTS,
	VALENTINE_GIFT_ITEMS,
} from '@widgetable/types';

@Injectable()
export class RewardsService {
	selectRandomItems(category: PetActionCategory, count: number): ItemReward[] {
		const actions = PET_ACTIONS_BY_CATEGORY[category].filter((a) => a.inventoryCost !== undefined);
		const itemCounts = new Map<string, number>();

		const itemsByTier = new Map<ItemTier, PetAction[]>();
		actions.forEach((action) => {
			const tier = (action.inventoryCost || 1) as ItemTier;
			if (!itemsByTier.has(tier)) itemsByTier.set(tier, []);
			itemsByTier.get(tier)!.push(action);
		});

		for (let i = 0; i < count; i++) {
			const tier = this.selectWeightedTier();
			const tierItems = itemsByTier.get(tier) || [];
			if (tierItems.length === 0) continue;

			const availableItems = tierItems.filter(
				(item) => (itemCounts.get(item.name) || 0) < REWARDS_CONFIG.MAX_DUPLICATE_ITEMS,
			);
			const selectedItem =
				availableItems.length > 0
					? availableItems[Math.floor(Math.random() * availableItems.length)]
					: tierItems[Math.floor(Math.random() * tierItems.length)];

			itemCounts.set(selectedItem.name, (itemCounts.get(selectedItem.name) || 0) + 1);
		}

		const result: ItemReward[] = [];
		itemCounts.forEach((quantity, name) => {
			const action = actions.find((a) => a.name === name)!;
			result.push({ name, quantity, tier: (action.inventoryCost || 1) as ItemTier });
		});

		return result;
	}

	selectWeightedTier(): ItemTier {
		const rand = Math.random() * 100;
		if (rand < TIER_WEIGHTS[ItemTier.BASIC]) return ItemTier.BASIC;
		if (rand < TIER_WEIGHTS[ItemTier.BASIC] + TIER_WEIGHTS[ItemTier.COMMON]) return ItemTier.COMMON;
		if (rand < TIER_WEIGHTS[ItemTier.BASIC] + TIER_WEIGHTS[ItemTier.COMMON] + TIER_WEIGHTS[ItemTier.PREMIUM])
			return ItemTier.PREMIUM;
		return ItemTier.LEGENDARY;
	}

	isValentineSeason(): boolean {
		return new Date().getMonth() === 1; // February
	}

	selectRandomValentineItems(count: number): ItemReward[] {
		const itemCounts = new Map<string, { count: number; tier: ItemTier }>();

		const itemsByTier = new Map<ItemTier, (typeof VALENTINE_GIFT_ITEMS)[number][]>();
		VALENTINE_GIFT_ITEMS.forEach((item) => {
			if (!itemsByTier.has(item.tier)) itemsByTier.set(item.tier, []);
			itemsByTier.get(item.tier)!.push(item);
		});

		for (let i = 0; i < count; i++) {
			const tier = this.selectWeightedTier();
			const tierItems = itemsByTier.get(tier) || [];
			if (tierItems.length === 0) continue;

			const selected = tierItems[Math.floor(Math.random() * tierItems.length)];
			const existing = itemCounts.get(selected.name);
			if (existing) {
				existing.count++;
			} else {
				itemCounts.set(selected.name, { count: 1, tier: selected.tier });
			}
		}

		const result: ItemReward[] = [];
		itemCounts.forEach((data, name) => {
			result.push({ name, quantity: data.count, tier: data.tier });
		});

		return result;
	}
}
