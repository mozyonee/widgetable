import api, { isAbortError } from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { usePolling } from '@/lib/hooks/usePolling';
import { useTranslation } from '@/i18n/useTranslation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	addFriend,
	addFriendRequestSent,
	removeFriend,
	removeFriendRequestReceived,
	removeFriendRequestSent,
	setFriendRequests,
	setFriends,
} from '@/store/slices/userSlice';
import { FriendshipStatus, User } from '@widgetable/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useFriends = (userId: string) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const friends = useAppSelector((state) => state.user.friends || []);
	const requests = useAppSelector((state) => state.user.friendRequests || { sent: [], received: [] });
	const friendsLoaded = useAppSelector((state) => state.user.friendsLoaded);

	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searching, setSearching] = useState(false);

	const loadData = useCallback(async () => {
		try {
			const [friendsRes, requestsRes] = await Promise.all([api.get('/friends'), api.get('/friends/requests')]);
			dispatch(setFriends(friendsRes.data));
			dispatch(setFriendRequests(requestsRes.data));
		} catch (error: any) {
			if (!isAbortError(error)) callError(t('friends.failedLoad'));
		}
	}, [dispatch, t]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	usePolling(loadData, 10000);

	const searchUsers = useCallback(async () => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		setSearching(true);
		try {
			const { data } = await api.get('/users/search', { params: { query: searchQuery } });
			setSearchResults(data.filter((u: User) => u._id !== userId));
		} catch {
			callError(t('friends.searchFailed'));
		} finally {
			setSearching(false);
		}
	}, [searchQuery, userId, t]);

	useEffect(() => {
		const timer = setTimeout(searchUsers, 300);
		return () => clearTimeout(timer);
	}, [searchUsers]);

	const addRequest = useCallback(
		async (recipientId: string) => {
			try {
				const { data } = await api.post('/friends/requests', { recipientId });
				dispatch(addFriendRequestSent(data));
				callSuccess(t('friends.requestSent'));
			} catch {
				callError(t('friends.failedSendRequest'));
			}
		},
		[dispatch, t],
	);

	const cancelRequest = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/friends/requests/${requestId}/cancel`);
				dispatch(removeFriendRequestSent(requestId));
				callSuccess(t('friends.requestCancelled'));
			} catch {
				callError(t('friends.failedCancelRequest'));
			}
		},
		[dispatch, t],
	);

	const acceptRequest = useCallback(
		async (requestId: string) => {
			try {
				await api.post(`/friends/requests/${requestId}/accept`);
				const request = requests.received.find((r) => r._id === requestId);
				if (request?.sender) {
					dispatch(addFriend(request.sender as User));
					dispatch(removeFriendRequestReceived(requestId));
				}
				callSuccess(t('friends.friendAdded'));
			} catch {
				callError(t('friends.failedAcceptRequest'));
			}
		},
		[requests.received, dispatch, t],
	);

	const declineRequest = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/friends/requests/${requestId}/decline`);
				dispatch(removeFriendRequestReceived(requestId));
				callSuccess(t('friends.requestDeclined'));
			} catch {
				callError(t('friends.failedDeclineRequest'));
			}
		},
		[dispatch, t],
	);

	const remove = useCallback(
		async (id: string) => {
			try {
				await api.delete(`/friends/${id}`);
				dispatch(removeFriend(id));
				callSuccess(t('friends.friendRemoved'));
			} catch {
				callError(t('friends.failedRemoveFriend'));
			}
		},
		[dispatch, t],
	);

	const statusMap = useMemo(() => {
		const map = new Map<string, FriendshipStatus>();
		friends.forEach((f) => f._id && map.set(f._id, FriendshipStatus.FRIENDS));
		requests.sent.forEach((r) => r.recipientId && map.set(r.recipientId, FriendshipStatus.SENT));
		requests.received.forEach((r) => r.senderId && map.set(r.senderId, FriendshipStatus.RECEIVED));
		return map;
	}, [friends, requests]);

	const getStatus = useCallback((id: string) => statusMap.get(id) || FriendshipStatus.NONE, [statusMap]);

	const allFriends = useMemo(() => {
		const list = [
			...requests.received.map((r) => ({
				...(r.sender as User),
				status: FriendshipStatus.RECEIVED as const,
				requestId: r._id,
			})),
			...requests.sent.map((r) => ({
				...(r.recipient as User),
				status: FriendshipStatus.SENT as const,
				requestId: r._id,
			})),
			...friends.map((f) => ({ ...f, status: FriendshipStatus.FRIENDS as const, requestId: undefined })),
		];

		return list.sort((a, b) => {
			const order: Record<FriendshipStatus.RECEIVED | FriendshipStatus.SENT | FriendshipStatus.FRIENDS, number> =
				{
					[FriendshipStatus.RECEIVED]: 0,
					[FriendshipStatus.SENT]: 1,
					[FriendshipStatus.FRIENDS]: 2,
				};
			return order[a.status] - order[b.status];
		});
	}, [friends, requests]);

	return {
		friends: allFriends,
		searchResults,
		searchQuery,
		loading: !friendsLoaded,
		searching,

		setSearchQuery,
		addRequest,
		cancelRequest,
		acceptRequest,
		declineRequest,
		remove,
		getStatus,
	};
};
