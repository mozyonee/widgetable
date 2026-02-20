import { useRefreshUser } from '@/features/auth/hooks/useRefreshUser';
import { setClaimStatus as setClaimStatusAction } from '@/features/claims/slices/claimsSlice';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api, { isAbortError } from '@/lib/api';
import { usePolling } from '@/lib/hooks/usePolling';
import { callError } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { ClaimResult } from '@widgetable/types';
import { useCallback, useEffect, useState } from 'react';

export const useClaims = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const claimStatus = useAppSelector((state) => state.claims.claimStatus);
	const loaded = useAppSelector((state) => state.claims.loaded);
	const refreshUser = useRefreshUser();

	const [claimingType, setClaimingType] = useState<'daily' | 'quick' | null>(null);
	const [lastRewards, setLastRewards] = useState<ClaimResult | null>(null);

	const loadClaimStatus = useCallback(async () => {
		try {
			const response = await api.get('/claims/status');
			dispatch(setClaimStatusAction(response.data));
		} catch (error: any) {
			if (!isAbortError(error)) callError(t('claims.failedLoad'));
		}
	}, [dispatch]);

	const executeClaim = async (endpoint: string, type: 'daily' | 'quick') => {
		if (claimingType) return;

		setClaimingType(type);

		try {
			const response = await api.post(endpoint);
			const result: ClaimResult = response.data;

			setLastRewards(result);
			await loadClaimStatus();

			await refreshUser();
		} catch (error: any) {
			callError(t('claims.failedClaim'));
		} finally {
			setClaimingType(null);
		}
	};

	const claimDaily = useCallback(async () => {
		await executeClaim('/claims/daily', 'daily');
	}, [claimingType, loadClaimStatus, dispatch, refreshUser]);

	const claimQuick = useCallback(async () => {
		await executeClaim('/claims/quick', 'quick');
	}, [claimingType, loadClaimStatus, dispatch, refreshUser]);

	useEffect(() => {
		loadClaimStatus();
	}, [loadClaimStatus]);

	usePolling(loadClaimStatus, 60000);

	return {
		claimStatus,
		claimingType,
		lastRewards,
		loading: !loaded,
		claimDaily,
		claimQuick,
		refreshStatus: loadClaimStatus,
		closeRewardsModal: () => setLastRewards(null),
	};
};
