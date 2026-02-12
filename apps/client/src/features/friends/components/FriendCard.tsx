'use client';

import { Button } from '@/components/ui/Button';
import { Check, Clock, Close, UserMinus, UserPlus } from '@nsmr/pixelart-react';
import { FriendshipStatus, User } from '@widgetable/types';
import UserCard from './UserCard';

interface FriendCardProps {
	user: User;
	status: FriendshipStatus;
	onAdd?: (id: string) => void;
	onCancel?: (id: string) => void;
	onAccept?: (id: string) => void;
	onDecline?: (id: string) => void;
	onRemove?: (id: string) => void;
	variant?: 'default' | 'nested';
}

const FriendCard = ({ user, status, onAdd, onCancel, onAccept, onDecline, onRemove, variant }: FriendCardProps) => {
	if (!user._id) return null;

	const actionConfig: Record<FriendshipStatus, React.ReactNode> = {
		[FriendshipStatus.NONE]: (
			<Button variant="primary" onClick={() => onAdd?.(user._id!)} className="p-2">
				<UserPlus width={20} height={20} />
			</Button>
		),
		[FriendshipStatus.SENT]: (
			<div className="flex-1 flex flex-col items-center gap-2">
				<div className="flex items-center gap-1 text-secondary text-sm">
					<Clock width={16} height={16} />
					<span>Pending</span>
				</div>
				<Button variant="secondary" onClick={() => onCancel?.(user._id!)} className="p-2">
					<Close width={20} height={20} />
				</Button>
			</div>
		),
		[FriendshipStatus.RECEIVED]: (
			<div className="flex flex-col items-center gap-2">
				<Button variant="primary" onClick={() => onAccept?.(user._id!)} className="p-2">
					<Check width={20} height={20} />
				</Button>
				<Button variant="secondary" onClick={() => onDecline?.(user._id!)} className="p-2">
					<Close width={20} height={20} />
				</Button>
			</div>
		),
		[FriendshipStatus.FRIENDS]: (
			<Button variant="secondary" onClick={() => onRemove?.(user._id!)} className="p-2">
				<UserMinus width={20} height={20} />
			</Button>
		),
	};

	return <UserCard user={user} actions={actionConfig[status]} variant={variant} />;
};

export default FriendCard;
