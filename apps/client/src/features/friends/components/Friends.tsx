'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { useAppSelector } from '@/store';
import { Search } from '@nsmr/pixelart-react';
import { RequestDirection, User } from '@widgetable/types';
import { useState } from 'react';
import { useCoparenting } from '../hooks/useCoparenting';
import { useFriends } from '../hooks/useFriends';
import CoparentingCard from './CoparentingCard';
import FriendCard from './FriendCard';
import { GiftModal } from './GiftModal';

const Friends = () => {
	const { t } = useTranslation();
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
	} = useCoparenting();

	const [giftTarget, setGiftTarget] = useState<User | null>(null);

	const validReceivedRequests = requests?.received.filter((req) => req.metadata?.pet && req.sender) || [];
	const validSentRequests = requests?.sent.filter((req) => req.metadata?.pet && req.recipient) || [];
	const hasCoparentingRequests = validReceivedRequests.length > 0 || validSentRequests.length > 0;

	return (
		<div className="flex flex-col gap-4 h-full">
			<h1 className="font-bold text-3xl text-foreground text-center">{t('friends.title')}</h1>

			<div className="bg-surface rounded-2xl shadow-md border border-secondary/20">
				<label className="relative p-2 flex items-center cursor-text">
					<Search
						className="absolute left-[23px] text-secondary pointer-events-none"
						width={25}
						height={25}
					/>
					<input
						type="text"
						placeholder={t('friends.searchPlaceholder')}
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
								status={getStatus(user._id)}
								onAdd={(id) => void addRequest(id)}
								onCancel={(id) => void cancelRequest(id)}
								onAccept={(id) => void acceptRequest(id)}
								onDecline={(id) => void declineRequest(id)}
								onRemove={(id) => void remove(id)}
								variant="nested"
							/>
						))}
					</div>
				)}

				{!searching && searchQuery.trim() && searchResults.length === 0 && (
					<p className="text-center text-secondary my-4">{t('friends.noUsersFound')}</p>
				)}
			</div>

			{hasCoparentingRequests && (
				<div className="flex flex-col gap-4">
					{validSentRequests.map((req) => (
						<CoparentingCard
							key={req._id}
							request={req}
							type={RequestDirection.SENT}
							onCancel={() => {
								if (req._id) void cancelCoparenting(req._id);
							}}
						/>
					))}

					{validReceivedRequests.map((req) => (
						<CoparentingCard
							key={req._id}
							request={req}
							type={RequestDirection.RECEIVED}
							onAccept={() => {
								if (req._id) void acceptCoparenting(req._id);
							}}
							onDecline={() => {
								if (req._id) void declineCoparenting(req._id);
							}}
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
							key={friend.requestId || friend._id}
							user={friend}
							status={friend.status}
							onCancel={() => {
								if (friend.requestId) void cancelRequest(friend.requestId);
							}}
							onAccept={() => {
								if (friend.requestId) void acceptRequest(friend.requestId);
							}}
							onDecline={() => {
								if (friend.requestId) void declineRequest(friend.requestId);
							}}
							onRemove={() => {
								if (friend._id) void remove(friend._id);
							}}
							onGift={(user) => setGiftTarget(user)}
						/>
					))}
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center">
					<p className="text-secondary text-center text-lg">{t('friends.searchToAdd')}</p>
				</div>
			)}

			{giftTarget && <GiftModal isOpen={!!giftTarget} onClose={() => setGiftTarget(null)} friend={giftTarget} />}
		</div>
	);
};

const FriendSkeleton = () => (
	<div className="bg-surface rounded-2xl p-4 shadow-md border border-secondary/20 flex items-center gap-4">
		<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
		<div className="flex-1">
			<Skeleton className="h-5 w-3/5 mb-2" />
			<Skeleton className="h-4 w-4/5" />
		</div>
	</div>
);

export default Friends;
