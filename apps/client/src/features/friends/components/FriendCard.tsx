'use client';
import { Button } from '@/components/ui/Button';
import { ICON_SIZES } from '@/config/constants';
import { useTranslation } from '@/i18n/hooks/useTranslation';
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
	onGift?: (user: User) => void;
	variant?: 'default' | 'nested';
}

const FriendCard = ({
	user,
	status,
	onAdd,
	onCancel,
	onAccept,
	onDecline,
	onRemove,
	onGift,
	variant,
}: FriendCardProps) => {
	const { t } = useTranslation();
	if (!user._id) return null;

	const actionConfig: Record<FriendshipStatus, React.ReactNode> = {
		[FriendshipStatus.NONE]: (
			<Button variant="primary" onClick={() => onAdd?.(user._id)} className="p-2">
				<UserPlus width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
			</Button>
		),
		[FriendshipStatus.SENT]: (
			<div className="flex-1 flex flex-col items-center gap-2">
				<div className="flex items-center gap-1 text-secondary text-sm">
					<Clock width={ICON_SIZES.SM} height={ICON_SIZES.SM} />
					<span>{t('friends.pending')}</span>
				</div>
				<Button variant="secondary" onClick={() => onCancel?.(user._id)} className="p-2">
					<Close width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
				</Button>
			</div>
		),
		[FriendshipStatus.RECEIVED]: (
			<div className="flex flex-col items-center gap-2">
				<Button variant="primary" onClick={() => onAccept?.(user._id)} className="p-2">
					<Check width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
				</Button>
				<Button variant="secondary" onClick={() => onDecline?.(user._id)} className="p-2">
					<Close width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
				</Button>
			</div>
		),
		[FriendshipStatus.FRIENDS]: (
			<div className="flex items-center gap-2">
				{onGift && (
					<Button variant="primary" onClick={() => onGift(user)} className="p-2">
						<img
							src="/valentine/red_heard.png"
							alt={t('gifts.sendGift')}
							className="w-5 h-5"
							style={{ imageRendering: 'pixelated' }}
						/>
					</Button>
				)}
				<Button variant="secondary" onClick={() => onRemove?.(user._id)} className="p-2">
					<UserMinus width={ICON_SIZES.MD} height={ICON_SIZES.MD} />
				</Button>
			</div>
		),
	};

	return <UserCard user={user} actions={actionConfig[status]} variant={variant} />;
};

export default FriendCard;
