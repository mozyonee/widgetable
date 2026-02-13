'use client';

import { VALENTINE_SPRITES } from '@/data/valentineSprites';
import { useTranslation } from '@/i18n/useTranslation';
import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserData } from '@/store/slices/userSlice';
import { VALENTINE_GIFT_ITEM_NAMES, User } from '@widgetable/types';
import { Close } from '@nsmr/pixelart-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface GiftModalProps {
	isOpen: boolean;
	onClose: () => void;
	friend: User;
}

export const GiftModal = ({ isOpen, onClose, friend }: GiftModalProps) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);
	const [mounted, setMounted] = useState(false);
	const [sending, setSending] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose]);

	const inventory = user?.inventory || {};
	const giftableItems = VALENTINE_GIFT_ITEM_NAMES
		.filter((name) => (inventory[name] ?? 0) > 0)
		.map((name) => ({ name, count: inventory[name]!, sprite: VALENTINE_SPRITES[name] }));

	const handleSend = async (itemName: string) => {
		if (sending) return;
		setSending(true);
		try {
			await api.post('/gifts/send', {
				recipientId: friend._id,
				itemName,
				quantity: 1,
			});
			const userResponse = await api.get('/auth/me');
			dispatch(setUserData(userResponse.data));
			callSuccess(t('gifts.sent', { name: friend.name }));
			onClose();
		} catch {
			callError(t('gifts.failedSend'));
		} finally {
			setSending(false);
		}
	};

	const modalContent = isOpen && mounted ? (
		<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
			<div
				ref={modalRef}
				className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[80vh] overflow-hidden flex flex-col"
			>
				<div className="flex items-center justify-between p-4 border-b border-secondary/20">
					<h2 className="text-xl font-bold text-foreground">{t('gifts.title')}</h2>
					<button
						onClick={onClose}
						className="text-secondary hover:text-foreground transition"
					>
						<Close width={24} height={24} />
					</button>
				</div>

				<div className="overflow-y-auto p-4">
					{giftableItems.length > 0 ? (
						<div className="grid grid-cols-3 gap-2">
							{giftableItems.map((item) => (
								<button
									key={item.name}
									onClick={() => handleSend(item.name)}
									disabled={sending}
									className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-primary/30 bg-white hover:bg-primary/5 transition-colors disabled:opacity-50"
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
					) : (
						<div className="text-center py-6">
								<p className="text-secondary">{t('gifts.noItems')}</p>
								<p className="text-secondary/60 text-sm mt-1">{t('gifts.noItemsHint')}</p>
							</div>
					)}
				</div>
			</div>
		</div>
	) : null;

	return mounted && modalContent ? createPortal(modalContent, document.body) : null;
};
