export enum ItemTier {
	BASIC = 1,
	COMMON = 2,
	PREMIUM = 3,
	LEGENDARY = 4,
}

export interface ItemReward {
	name: string;
	quantity: number;
	tier: ItemTier;
}
