import { ItemReward } from '@widgetable/types';

export interface ClaimStatus {
	dailyAvailable: boolean;
	quickAvailable: boolean;
	nextDailyTime?: Date;
	nextQuickTime?: Date;
	petCount: number;
}

export interface ClaimResult {
	success: boolean;
	rewards: {
		food: ItemReward[];
		drinks: ItemReward[];
		hygiene: ItemReward[];
		care: ItemReward[];
		eggs: number;
	};
	totalItems: number;
	nextClaimTime: Date;
}
