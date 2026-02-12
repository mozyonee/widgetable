'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/store';
import { Search } from '@nsmr/pixelart-react';
import { RequestDirection } from '@widgetable/types';
import { useCoparenting } from '../hooks/useCoparenting';
import { useFriends } from '../hooks/useFriends';
import CoparentingCard from './CoparentingCard';
import FriendCard from './FriendCard';

const Friends = () => {
	const user = useAppSelector((state) => state.user.userData);
	if (!user?._id) return null;

	const {
		friends,
		searchResults,
		searchQuery,
		loading,
		searching,
		setSearchQuery,
		addRequest,
		cancelRequest,
		acceptRequest,
		declineRequest,
		remove,
		getStatus,
	} = useFriends(user._id);

	const {
		requests,
		accept: acceptCoparenting,
		decline: declineCoparenting,
		cancel: cancelCoparenting,
	} = useCoparenting(user._id);

	const validReceivedRequests = requests?.received.filter((req) => req.metadata?.pet && req.sender) || [];
	const validSentRequests = requests?.sent.filter((req) => req.metadata?.pet && req.recipient) || [];
	const hasCoparentingRequests = validReceivedRequests.length > 0 || validSentRequests.length > 0;

	return (
		<div className="flex flex-col gap-4 h-full">
			<h1 className="font-bold text-3xl text-foreground text-center">Friends</h1>

			<div className="bg-white rounded-2xl shadow-md border border-secondary/20">
				<label className="relative p-4 flex items-center cursor-text">
					<Search className="absolute left-[23px] text-secondary pointer-events-none" width={25} height={25} />
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
						{searchResults.map((user) => (
							<FriendCard
								key={user._id}
								user={user}
								status={getStatus(user._id!)}
								onAdd={addRequest}
								onCancel={cancelRequest}
								onAccept={acceptRequest}
								onDecline={declineRequest}
								onRemove={remove}
								variant="nested"
							/>
						))}
					</div>
				)}

				{!searching && searchQuery.trim() && searchResults.length === 0 && (
					<p className="text-center text-secondary my-4">No users found</p>
				)}
			</div>

			{hasCoparentingRequests && (
				<div className="flex flex-col gap-4">
					{validSentRequests.map((req) => (
						<CoparentingCard
							key={req._id}
							request={req}
							type={RequestDirection.SENT}
							onCancel={() => req._id && cancelCoparenting(req._id)}
						/>
					))}

					{validReceivedRequests.map((req) => (
						<CoparentingCard
							key={req._id}
							request={req}
							type={RequestDirection.RECEIVED}
							onAccept={() => req._id && acceptCoparenting(req._id)}
							onDecline={() => req._id && declineCoparenting(req._id)}
						/>
					))}
				</div>
			)}

			{loading ? (
				<div className="flex flex-col gap-4">
					<FriendSkeleton />
					<FriendSkeleton />
					<FriendSkeleton />
				</div>
			) : friends.length > 0 ? (
				<div className="flex flex-col gap-4">
					{friends.map((friend) => (
						<FriendCard
							key={friend._id}
							user={friend}
							status={friend.status}
							onCancel={() => friend.requestId && cancelRequest(friend.requestId)}
							onAccept={() => friend.requestId && acceptRequest(friend.requestId)}
							onDecline={() => friend.requestId && declineRequest(friend.requestId)}
							onRemove={() => friend._id && remove(friend._id)}
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
};

const FriendSkeleton = () => (
	<div className="bg-white rounded-2xl p-4 shadow-md border border-secondary/20 flex items-center gap-4">
		<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
		<div className="flex-1">
			<Skeleton className="h-5 w-3/5 mb-2" />
			<Skeleton className="h-4 w-4/5" />
		</div>
	</div>
);

export default Friends;
