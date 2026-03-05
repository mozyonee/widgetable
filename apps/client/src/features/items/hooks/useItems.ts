'use client';
import { useRefreshUser } from '@/features/auth/hooks/useRefreshUser';
import { setItemStatus as setItemStatusAction } from '@/features/items/slices/itemsSlice';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api, { isAbortError } from '@/lib/api';
import { usePolling } from '@/lib/hooks/usePolling';
import { callError } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { ClaimType, ItemResult, ItemStatus } from '@widgetable/types';
import { useCallback, useEffect, useState } from 'react';

export const useItems = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const itemStatus = useAppSelector((state) => state.items.itemStatus);
	const loaded = useAppSelector((state) => state.items.loaded);
	const refreshUser = useRefreshUser();

	const [claimingType, setClaimingType] = useState<ClaimType | null>(null);
	const [lastItems, setLastItems] = useState<ItemResult | null>(null);

	const loadItemStatus = useCallback(async () => {
		try {
			const response = await api.get<ItemStatus>('/items/status');
			dispatch(setItemStatusAction(response.data));
		} catch (error: unknown) {
			if (!isAbortError(error)) callError(t('items.failedLoad'));
		}
	}, [dispatch]);

	const executeItemClaim = async (endpoint: string, type: ClaimType) => {
		if (claimingType) return;

		setClaimingType(type);

		try {
			const response = await api.post<ItemResult>(endpoint);
			const result = response.data;

			setLastItems(result);
			await loadItemStatus();

			await refreshUser();
		} catch {
			callError(t('items.failedClaim'));
		} finally {
			setClaimingType(null);
		}
	};

	const claimDaily = useCallback(async () => {
		await executeItemClaim('/items/daily', ClaimType.DAILY);
	}, [claimingType, loadItemStatus, dispatch, refreshUser]);

	const claimQuick = useCallback(async () => {
		await executeItemClaim('/items/quick', ClaimType.QUICK);
	}, [claimingType, loadItemStatus, dispatch, refreshUser]);

	useEffect(() => {
		void loadItemStatus();
	}, [loadItemStatus]);

	usePolling(() => void loadItemStatus(), 60000);

	return {
		itemStatus,
		claimingType,
		lastItems,
		loading: !loaded,
		claimDaily,
		claimQuick,
		refreshStatus: loadItemStatus,
		closeItemsModal: () => setLastItems(null),
	};
};
