import api, { isAbortError } from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setClaimStatus as setClaimStatusAction } from '@/features/claims/slices/claimsSlice';
import type { ClaimStatus } from '@/features/claims/slices/claimsSlice';
import { setUserData } from '@/store/slices/userSlice';
import { useCallback, useEffect, useState } from 'react';

export type { ClaimStatus } from '@/features/claims/slices/claimsSlice';

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

export interface ClaimResult {
	success: boolean;
	rewards: {
		food: ItemReward[];
		drinks: ItemReward[];
		hygiene: ItemReward[];
		eggs: number;
	};
	totalItems: number;
	nextClaimTime: Date;
}

export const useClaims = () => {
	const dispatch = useAppDispatch();
	const claimStatus = useAppSelector((state) => state.claims.claimStatus);
	const loaded = useAppSelector((state) => state.claims.loaded);

	const [claimingType, setClaimingType] = useState<'daily' | 'quick' | 'debug' | null>(null);
	const [lastRewards, setLastRewards] = useState<ClaimResult | null>(null);

	const loadClaimStatus = useCallback(async () => {
		try {
			const response = await api.get('/claims/status');
			dispatch(setClaimStatusAction(response.data));
		} catch (error: any) {
			if (!isAbortError(error)) callError('Failed to load claim status');
		}
	}, [dispatch]);

	const executeClaim = async (endpoint: string, toastMessage: string, type: 'daily' | 'quick' | 'debug') => {
		if (claimingType) return;

		setClaimingType(type);
		callSuccess('Collecting care package...');

		try {
			// Simulate collection animation (2.5 seconds)
			await new Promise((resolve) => setTimeout(resolve, 2500));

			const response = await api.post(endpoint);
			const result: ClaimResult = response.data;

			setLastRewards(result);
			await loadClaimStatus();

			// Refresh user data to update inventory
			const userResponse = await api.get('/users/me');
			dispatch(setUserData(userResponse.data));

			callSuccess(`🎉 ${toastMessage} ${result.totalItems} items!`);
		} catch (error: any) {
			if (error.response?.status === 400) {
				callError(error.response.data.message);
			} else {
				callError('Failed to claim rewards. Please try again.');
			}
		} finally {
			setClaimingType(null);
		}
	};

	const claimDaily = useCallback(async () => {
		await executeClaim('/claims/daily', 'Collected', 'daily');
	}, [claimingType, loadClaimStatus, dispatch]);

	const claimQuick = useCallback(async () => {
		await executeClaim('/claims/quick', 'Collected', 'quick');
	}, [claimingType, loadClaimStatus, dispatch]);

	const claimDebug = useCallback(async () => {
		await executeClaim('/claims/debug', 'Debug claim:', 'debug');
	}, [claimingType, loadClaimStatus, dispatch]);

	useEffect(() => {
		loadClaimStatus();
		const interval = setInterval(loadClaimStatus, 60000);
		return () => clearInterval(interval);
	}, [loadClaimStatus]);

	return {
		claimStatus,
		claimingType,
		lastRewards,
		loading: !loaded,
		claimDaily,
		claimQuick,
		claimDebug,
		refreshStatus: loadClaimStatus,
		closeRewardsModal: () => setLastRewards(null),
	};
};
