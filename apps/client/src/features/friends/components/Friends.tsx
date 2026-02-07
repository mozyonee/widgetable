'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useAppSelector } from '@/store';
import { User } from '@widgetable/types';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FriendRequests, FriendshipStatus, FriendWithStatus } from '../types/friends.types';
import FriendCard from './FriendCard';
import SearchResultCard from './SearchResultCard';

const FriendSkeleton = () => (
	<div className="bg-white rounded-2xl p-4 shadow-md border border-secondary/20 flex items-center gap-4">
		<Skeleton className="h-12 w-12 rounded-full" />
		<div className="flex-1">
			<Skeleton className="h-5 w-32 mb-2" />
			<Skeleton className="h-4 w-40" />
		</div>
	</div>
);

export default function FriendsPage() {
	const user = useAppSelector((state) => state.user.userData);
	const [friends, setFriends] = useState<User[]>([]);
	const [friendRequests, setFriendRequests] = useState<FriendRequests>({ received: [], sent: [] });
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [searching, setSearching] = useState(false);

	const fetchFriends = async () => {
		if (!user?._id) return;
		setLoading(true);
		try {
			const [friendsRes, requestsRes] = await Promise.all([
				api.get(`/users/${user._id}/friends`),
				api.get(`/users/${user._id}/friend-requests`),
			]);
			setFriends(friendsRes.data);
			setFriendRequests(requestsRes.data);
		} catch (error: any) {
			callError('Failed to load friends');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFriends();
	}, [user?._id]);

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			setSearchResults([]);
			return;
		}

		setSearching(true);
		try {
			const response = await api.get('/users/search', { params: { query: searchQuery } });
			const results = response.data.filter((searchUser: User) => {
				return searchUser._id !== user?._id;
			});
			setSearchResults(results);
		} catch (error: any) {
			callError(error.response?.data?.message || 'Search failed');
		} finally {
			setSearching(false);
		}
	};

	const handleSendRequest = async (friendId: string) => {
		try {
			await api.post(`/users/${user?._id}/friend-requests/${friendId}`);
			setFriendRequests((prev) => ({
				...prev,
				sent: [...prev.sent, searchResults.find(u => u._id === friendId)!],
			}));
			callSuccess('Friend request sent');
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to send friend request');
		}
	};

	const handleCancelRequest = async (friendId: string) => {
		try {
			await api.delete(`/users/${user?._id}/friend-requests/${friendId}/cancel`);
			setFriendRequests((prev) => ({
				...prev,
				sent: prev.sent.filter(f => f._id !== friendId),
			}));
			callSuccess('Friend request cancelled');
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to cancel request');
		}
	};

	const handleAcceptRequest = async (friendId: string) => {
		try {
			await api.post(`/users/${user?._id}/friend-requests/${friendId}/accept`);
			const acceptedFriend = friendRequests.received.find(f => f._id === friendId);
			if (acceptedFriend) {
				setFriends((prev) => [...prev, acceptedFriend]);
				setFriendRequests((prev) => ({
					...prev,
					received: prev.received.filter(f => f._id !== friendId),
				}));
				callSuccess('Friend request accepted');
			}
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to accept request');
		}
	};

	const handleDeclineRequest = async (friendId: string) => {
		try {
			await api.delete(`/users/${user?._id}/friend-requests/${friendId}/decline`);
			setFriendRequests((prev) => ({
				...prev,
				received: prev.received.filter(f => f._id !== friendId),
			}));
			callSuccess('Friend request declined');
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to decline request');
		}
	};

	const handleRemoveFriend = async (friendId: string) => {
		try {
			await api.delete(`/users/${user?._id}/friends/${friendId}`);
			setFriends((prev) => prev.filter(f => f._id !== friendId));
			callSuccess('Friend removed');
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to remove friend');
		}
	};

	const getUserStatus = (userId: string): FriendshipStatus => {
		if (friends.some(f => f._id === userId)) return FriendshipStatus.FRIENDS;
		if (friendRequests.sent.some(f => f._id === userId)) return FriendshipStatus.SENT;
		if (friendRequests.received.some(f => f._id === userId)) return FriendshipStatus.RECEIVED;
		return FriendshipStatus.NONE;
	};

	const sortedFriendsList = useMemo(() => {
		const statusOrder = {
			[FriendshipStatus.RECEIVED]: 0,
			[FriendshipStatus.SENT]: 1,
			[FriendshipStatus.FRIENDS]: 2,
		};

		const allFriends: FriendWithStatus[] = [
			...friendRequests.received.map(f => ({ ...f, status: FriendshipStatus.RECEIVED as const })),
			...friendRequests.sent.map(f => ({ ...f, status: FriendshipStatus.SENT as const })),
			...friends.map(f => ({ ...f, status: FriendshipStatus.FRIENDS as const })),
		];

		return allFriends.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
	}, [friends, friendRequests]);

	useEffect(() => {
		const delaySearch = setTimeout(() => {
			if (searchQuery.trim()) {
				handleSearch();
			} else {
				setSearchResults([]);
			}
		}, 300);

		return () => clearTimeout(delaySearch);
	}, [searchQuery]);

	return (
		<div className="flex flex-col gap-4 h-full">
			<h1 className="font-bold text-3xl text-foreground text-center">Friends</h1>

			<div className="bg-white rounded-2xl shadow-md border border-secondary/20">
				<label className="relative p-4 flex items-center cursor-text">
					<Search className="absolute left-[23px] text-secondary pointer-events-none" size={25} />
					<input
						type="text"
						placeholder="Search users..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-11 pr-4 py-2 bg-transparent focus:outline-none text-foreground"
					/>
				</label>

				{searchQuery && <hr className="border-secondary/20 mx-4" />}

				{searching && (
					<div className="flex flex-col gap-2 p-4">
						<FriendSkeleton />
					</div>
				)}

				{!searching && searchResults.length > 0 && (
					<div className="flex flex-col">
						{searchResults.map((result) => (
							<SearchResultCard
								key={result._id}
								friend={result}
								status={getUserStatus(result._id!)}
								onSendRequest={handleSendRequest}
								onCancelRequest={handleCancelRequest}
								onAccept={handleAcceptRequest}
								onDecline={handleDeclineRequest}
								onRemove={handleRemoveFriend}
							/>
						))}
					</div>
				)}

				{!searching && searchQuery.trim() && searchResults.length === 0 && (
					<p className="text-center text-secondary my-4">No users found</p>
				)}
			</div>

			{loading ? (
				<div className="flex flex-col gap-4">
					<FriendSkeleton />
					<FriendSkeleton />
					<FriendSkeleton />
				</div>
			) : sortedFriendsList.length > 0 ? (
				<div className="flex flex-col gap-4">
					{sortedFriendsList.map((friend) => (
						<FriendCard
							key={friend._id}
							friend={friend}
							status={friend.status}
							onCancelRequest={handleCancelRequest}
							onAccept={handleAcceptRequest}
							onDecline={handleDeclineRequest}
							onRemove={handleRemoveFriend}
						/>
					))}
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center">
					<p className="text-secondary text-center text-lg">Search for users above to add friends!</p>
				</div>
			)}
		</div>
	);
}
