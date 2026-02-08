import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
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
	const dispatch = useAppDispatch();
	const friends = useAppSelector((state) => state.user.friends || []);
	const requests = useAppSelector((state) => state.user.friendRequests || { sent: [], received: [] });

	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [searching, setSearching] = useState(false);

	// Fetches

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [friendsRes, requestsRes] = await Promise.all([api.get('/friends'), api.get('/friends/requests')]);
			dispatch(setFriends(friendsRes.data));
			dispatch(setFriendRequests(requestsRes.data));
		} catch {
			callError('Failed to load friends');
		} finally {
			setLoading(false);
		}
	}, [dispatch]);

	useEffect(() => {
		loadData();

		// Poll for new requests every 10 seconds
		const interval = setInterval(loadData, 10000);
		return () => clearInterval(interval);
	}, [loadData]);

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
			callError('Search failed');
		} finally {
			setSearching(false);
		}
	}, [searchQuery, userId]);

	useEffect(() => {
		const timer = setTimeout(searchUsers, 300);
		return () => clearTimeout(timer);
	}, [searchUsers]);

	// Actions

	const addRequest = useCallback(
		async (recipientId: string) => {
			try {
				const { data } = await api.post('/friends/requests', { recipientId });
				dispatch(addFriendRequestSent(data));
				callSuccess('Friend request sent');
			} catch {
				callError('Failed to send request');
			}
		},
		[dispatch],
	);

	const cancelRequest = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/friends/requests/${requestId}/cancel`);
				dispatch(removeFriendRequestSent(requestId));
				callSuccess('Request cancelled');
			} catch {
				callError('Failed to cancel request');
			}
		},
		[dispatch],
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
				callSuccess('Friend added');
			} catch {
				callError('Failed to accept request');
			}
		},
		[requests.received, dispatch],
	);

	const declineRequest = useCallback(
		async (requestId: string) => {
			try {
				await api.delete(`/friends/requests/${requestId}/decline`);
				dispatch(removeFriendRequestReceived(requestId));
				callSuccess('Request declined');
			} catch {
				callError('Failed to decline request');
			}
		},
		[dispatch],
	);

	const remove = useCallback(
		async (id: string) => {
			try {
				await api.delete(`/friends/${id}`);
				dispatch(removeFriend(id));
				callSuccess('Friend removed');
			} catch {
				callError('Failed to remove friend');
			}
		},
		[dispatch],
	);

	// Helpers

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
		// State
		friends: allFriends,
		searchResults,
		searchQuery,
		loading,
		searching,

		// Actions
		setSearchQuery,
		addRequest,
		cancelRequest,
		acceptRequest,
		declineRequest,
		remove,
		getStatus,
	};
};
