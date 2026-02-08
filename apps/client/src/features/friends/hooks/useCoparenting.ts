import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	removeCoparentingRequestReceived,
	removeCoparentingRequestSent,
	setCoparentingRequests,
} from '@/store/slices/userSlice';
import { useCallback, useEffect } from 'react';

export const useCoparenting = (userId: string) => {
	const dispatch = useAppDispatch();
	const requests = useAppSelector((state) => state.user.coparentingRequests);

	// Fetches

	const loadRequests = useCallback(async () => {
		try {
			const { data } = await api.get('/coparenting/requests');
			dispatch(setCoparentingRequests(data));
		} catch {
			callError('Failed to load requests');
		}
	}, [dispatch]);

	useEffect(() => {
		loadRequests();

		// Poll for new requests every 10 seconds
		const interval = setInterval(loadRequests, 10000);
		return () => clearInterval(interval);
	}, [loadRequests]);

	// Actions

	const accept = useCallback(
		async (requestId: string) => {
			try {
				await api.post(`/coparenting/requests/${requestId}/accept`);
				dispatch(removeCoparentingRequestReceived(requestId));
				callSuccess('Request accepted');
			} catch {
				callError('Failed to accept');
			}
		},
		[dispatch],
	);

	const decline = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/coparenting/requests/${requestId}/decline`);
				dispatch(removeCoparentingRequestReceived(requestId));
				callSuccess('Request declined');
			} catch {
				callError('Failed to decline');
			}
		},
		[dispatch],
	);

	const cancel = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/coparenting/requests/${requestId}/cancel`);
				dispatch(removeCoparentingRequestSent(requestId));
				callSuccess('Request cancelled');
			} catch {
				callError('Failed to cancel');
			}
		},
		[dispatch],
	);

	return {
		requests,
		accept,
		decline,
		cancel,
	};
};
