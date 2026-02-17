'use client';

import UserCard from '@/features/friends/components/UserCard';
import { useTranslation } from '@/i18n/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { Clock } from '@nsmr/pixelart-react';
import Link from 'next/link';

interface InviteModalProps {
	isOpen: boolean;
	onClose: () => void;
	friends: any[];
	onInvite: (friendId: string) => void;
}

export const InviteModal = ({ isOpen, onClose, friends, onInvite }: InviteModalProps) => {
	const { t } = useTranslation();

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('invite.title')}
			maxWidth="sm"
			headerClassName="bg-surface text-foreground border-b border-secondary/20"
		>
			{friends.length > 0 ? (
				friends.map((friend) => (
					<button
						key={friend._id}
						onClick={() => {
							if (!friend.hasPendingRequest) {
								onInvite(friend._id!);
								onClose();
							}
						}}
						disabled={friend.hasPendingRequest}
						className={`w-full text-left transition ${
							friend.hasPendingRequest ? 'cursor-not-allowed' : 'hover:bg-secondary/10'
						}`}
					>
						<div className={friend.hasPendingRequest ? 'opacity-50' : ''}>
							<UserCard
								user={friend}
								variant="nested"
								actions={
									friend.hasPendingRequest && (
										<Clock width={20} height={20} className="text-secondary" />
									)
								}
							/>
						</div>
					</button>
				))
			) : (
				<div className="flex flex-col items-center gap-2 p-6">
					<span className="text-secondary">{t('invite.noFriends')}</span>
					<Link href="/friends" className="text-primary font-semibold hover:underline">
						{t('invite.findMore')}
					</Link>
				</div>
			)}
		</Modal>
	);
};
