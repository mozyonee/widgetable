import { Button } from '@/components/ui/Button';
import type { User } from '@widgetable/types';
import { Check, CircleUserRound, Clock, UserPlus, UserX, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { FriendshipStatus } from '../types/friends.types';

interface SearchResultCardProps {
	friend: User;
	status: FriendshipStatus;
	onSendRequest?: (friendId: string) => void;
	onCancelRequest?: (friendId: string) => void;
	onAccept?: (friendId: string) => void;
	onDecline?: (friendId: string) => void;
	onRemove?: (friendId: string) => void;
}

export default function SearchResultCard({
	friend,
	status,
	onSendRequest,
	onCancelRequest,
	onAccept,
	onDecline,
	onRemove,
}: SearchResultCardProps) {
	const [imageError, setImageError] = useState(false);

	return (
		<div className="flex items-center gap-4 p-4">
			<div className="w-12 h-12 rounded-full bg-background flex items-center justify-center flex-shrink-0">
				{!imageError && friend.picture ? (
					<Image
						src={`${process.env.NEXT_PUBLIC_SERVER_URL}/users/${friend._id}/picture`}
						alt={friend.name || friend.email || 'User'}
						height={48}
						width={48}
						className="rounded-full object-cover h-12 w-12"
						onError={() => setImageError(true)}
					/>
				) : (
					<CircleUserRound strokeWidth={2} size={35} color="var(--secondary)" />
				)}
			</div>

			<div className="flex-1 min-w-0">
				<p className="text-lg font-bold text-foreground truncate">{friend.name || 'User'}</p>
				<p className="text-sm text-secondary truncate">{friend.email}</p>
			</div>

			{status === FriendshipStatus.NONE && onSendRequest && friend._id && (
				<Button variant="primary" size="sm" onClick={() => onSendRequest(friend._id!)} style="flex items-center gap-1">
					<UserPlus size={16} />
					Add
				</Button>
			)}

			{status === FriendshipStatus.SENT && onCancelRequest && friend._id && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-secondary flex items-center gap-1">
						<Clock size={16} />
						Pending
					</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onCancelRequest(friend._id!)}
						style="text-secondary hover:bg-secondary/10"
					>
						<X size={20} />
					</Button>
				</div>
			)}

			{status === FriendshipStatus.RECEIVED && onAccept && onDecline && friend._id && (
				<div className="flex items-center gap-2">
					<Button variant="primary" size="sm" onClick={() => onAccept(friend._id!)} style="flex items-center gap-1">
						<Check size={16} />
						Accept
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDecline(friend._id!)}
						style="text-danger hover:bg-danger/10"
					>
						<X size={20} />
					</Button>
				</div>
			)}

			{status === FriendshipStatus.FRIENDS && onRemove && friend._id && (
				<Button variant="ghost" size="sm" onClick={() => onRemove(friend._id!)} style="text-danger hover:bg-danger/10">
					<UserX size={20} />
				</Button>
			)}
		</div>
	);
}
