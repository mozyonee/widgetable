'use client';

import { ICON_SIZES } from '@/config/constants';
import { User as UserIcon } from '@nsmr/pixelart-react';
import type { User } from '@widgetable/types';
import Image from 'next/image';
import { ReactNode, useState } from 'react';

interface UserCardProps {
	user: User;
	actions?: ReactNode;
	variant?: 'default' | 'nested';
}

const UserCard = ({ user, actions, variant = 'default' }: UserCardProps) => {
	const [imageError, setImageError] = useState(false);

	const cardStyles =
		variant === 'nested'
			? 'bg-transparent p-2 flex items-center gap-4'
			: 'bg-surface rounded-2xl p-2 shadow-md border border-secondary/20 flex items-center gap-4 flex-wrap';

	const hasPicture = user.picture && !imageError;

	return (
		<div className={cardStyles}>
			<div className="w-12 h-12 rounded-full bg-background flex items-center justify-center flex-shrink-0">
				{hasPicture ? (
					<Image
						src={`${process.env.NEXT_PUBLIC_SERVER_URL}/users/${user._id}/picture`}
						alt={user.name || user.email}
						height={48}
						width={48}
						className="rounded-full object-cover h-12 w-12"
						onError={() => setImageError(true)}
					/>
				) : (
					<UserIcon width={ICON_SIZES.XXL} height={ICON_SIZES.XXL} className="text-secondary" />
				)}
			</div>

			<div className="flex-2 min-w-4">
				<p className="text-lg font-bold text-foreground truncate">{user.name}</p>
				<p className="text-secondary truncate mt-1">{user.email}</p>
			</div>

			{actions}
		</div>
	);
};

export default UserCard;
