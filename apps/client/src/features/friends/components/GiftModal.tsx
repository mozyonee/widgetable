'use client';

import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { getActionSprite } from '@/data/actionSprites';
import { useRefreshUser } from '@/features/auth/hooks/useRefreshUser';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api from '@/lib/api';
import { useImagesLoaded } from '@/lib/hooks/useImagesLoaded';
import { callError, callSuccess } from '@/lib/toast';
import { useAppSelector } from '@/store';
import { User, VALENTINE_GIFT_ITEM_NAMES } from '@widgetable/types';
import Image from 'next/image';
import { useState } from 'react';

interface GiftModalProps {
	isOpen: boolean;
	onClose: () => void;
	friend: User;
}

export const GiftModal = ({ isOpen, onClose, friend }: GiftModalProps) => {
	const { t } = useTranslation();
	const user = useAppSelector((state) => state.user.userData);
	const refreshUser = useRefreshUser();
	const [sending, setSending] = useState(false);

	const inventory = user?.inventory || {};
	const giftableItems = VALENTINE_GIFT_ITEM_NAMES.filter((name) => (inventory[name] ?? 0) > 0).map((name) => ({
		name,
		count: inventory[name],
		sprite: getActionSprite(name),
	}));

	const spriteUrls = giftableItems.map((item) => item.sprite).filter(Boolean) as string[];
	const spritesLoaded = useImagesLoaded(spriteUrls);

	const handleSend = async (itemName: string) => {
		if (sending) return;
		setSending(true);
		try {
			await api.post('/gifts/send', {
				recipientId: friend._id,
				itemName,
				quantity: 1,
			});
			await refreshUser();
			callSuccess(t('gifts.sent', { name: friend.name }));
			onClose();
		} catch {
			callError(t('gifts.failedSend'));
		} finally {
			setSending(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('gifts.title')}
			maxWidth="sm"
			headerClassName="bg-surface text-foreground border-b border-secondary/20"
			contentClassName="p-4"
		>
			{giftableItems.length > 0 ? (
				!spritesLoaded ? (
					<div className="grid grid-cols-3 gap-2">
						{Array.from({ length: giftableItems.length }).map((_, i) => (
							<Skeleton key={i} className="aspect-square rounded-lg" />
						))}
					</div>
				) : (
					<div className="grid grid-cols-3 gap-2">
						{giftableItems.map((item) => (
							<button
								key={item.name}
								onClick={() => void handleSend(item.name)}
								disabled={sending}
								className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-primary/30 bg-surface hover:bg-primary/5 transition-colors disabled:opacity-50"
							>
								{item.sprite && (
									<div className="relative w-16 h-16">
										<Image
											src={item.sprite}
											alt={item.name}
											fill
											className="object-contain"
											style={{ imageRendering: 'pixelated' }}
										/>
									</div>
								)}
								<div className="text-xs font-semibold text-center text-foreground">
									{t(`action.${item.name}`)}
								</div>
								<div className="text-xs text-secondary">x{item.count}</div>
							</button>
						))}
					</div>
				)
			) : (
				<div className="text-center py-6">
					<p className="text-secondary">{t('gifts.noItems')}</p>
					<p className="text-secondary/60 text-sm mt-1">{t('gifts.noItemsHint')}</p>
				</div>
			)}
		</Modal>
	);
};
