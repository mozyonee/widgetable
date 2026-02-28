import {
	removeCoparentingRequestReceived,
	removeCoparentingRequestSent,
	setCoparentingRequests,
} from '@/features/auth/slices/userSlice';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api from '@/lib/api';
import { usePolling } from '@/lib/hooks/usePolling';
import { callError, callSuccess } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { Request } from '@widgetable/types';
import { useCallback, useEffect } from 'react';

export const useCoparenting = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const requests = useAppSelector((state) => state.user.coparentingRequests);

	const loadRequests = useCallback(async () => {
		try {
			const { data } = await api.get<{ sent: Request[]; received: Request[] }>('/coparenting/requests');
			dispatch(setCoparentingRequests(data));
		} catch {
			callError(t('coparenting.failedLoadRequests'));
		}
	}, [dispatch, t]);

	useEffect(() => {
		void loadRequests();
	}, [loadRequests]);

	usePolling(() => void loadRequests(), 10000);

	const accept = useCallback(
		async (requestId: string) => {
			try {
				await api.post(`/coparenting/requests/${requestId}/accept`);
				dispatch(removeCoparentingRequestReceived(requestId));
				callSuccess(t('coparenting.requestAccepted'));
			} catch {
				callError(t('coparenting.failedAccept'));
			}
		},
		[dispatch, t],
	);

	const decline = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/coparenting/requests/${requestId}/decline`);
				dispatch(removeCoparentingRequestReceived(requestId));
				callSuccess(t('coparenting.requestDeclined'));
			} catch {
				callError(t('coparenting.failedDecline'));
			}
		},
		[dispatch, t],
	);

	const cancel = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/coparenting/requests/${requestId}/cancel`);
				dispatch(removeCoparentingRequestSent(requestId));
				callSuccess(t('coparenting.requestCancelled'));
			} catch {
				callError(t('coparenting.failedCancel'));
			}
		},
		[dispatch, t],
	);

	return {
		requests,
		accept,
		decline,
		cancel,
	};
};
