'use client';

import { ACTION_SPRITES } from '@/data/actionSprites';
import { useTranslation } from '@/i18n/useTranslation';
import { EGG_ITEM_NAME } from '@widgetable/types';
import Image from 'next/image';
import { useEffect } from 'react';
import { Bed, Edit, Coffee, Zap, Check } from '@nsmr/pixelart-react';
import { ClaimResult, ItemReward, ItemTier } from '../hooks/useClaims';

interface RewardsModalProps {
	rewards: ClaimResult;
	onClose: () => void;
}

const getTierColor = (tier: ItemTier): string => {
	switch (tier) {
		case ItemTier.BASIC:
			return 'border-gray-400';
		case ItemTier.COMMON:
			return 'border-green-500';
		case ItemTier.PREMIUM:
			return 'border-blue-500';
		case ItemTier.LEGENDARY:
			return 'border-purple-500';
		default:
			return 'border-gray-400';
	}
};

const ItemDisplay = ({ item, index }: { item: ItemReward; index: number }) => {
	const spritePath = ACTION_SPRITES[item.name];

	return (
		<div
			className={`
				flex flex-col items-center gap-1 p-2 rounded-lg border-2 bg-white
				${getTierColor(item.tier)}
				animate-[fadeIn_0.3s_ease-out]
			`}
			style={{ animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
		>
			{spritePath && (
				<div className="relative w-12 h-12">
					<Image src={`/assets_new/${spritePath}`} alt={item.name} fill className="object-contain pixelated" />
				</div>
			)}
			<div className="text-xs font-semibold text-center">{item.name}</div>
			<div className="text-xs text-muted-foreground">x{item.quantity}</div>
		</div>
	);
};

export const RewardsModal = ({ rewards, onClose }: RewardsModalProps) => {
	const { t } = useTranslation();

	useEffect(() => {
		const scrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${scrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		return () => {
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.left = '';
			document.body.style.right = '';
			window.scrollTo(0, scrollY);
		};
	}, []);

	// Sort items by tier (descending: LEGENDARY -> PREMIUM -> COMMON -> BASIC)
	const sortedFood = [...rewards.rewards.food].sort((a, b) => b.tier - a.tier);
	const sortedDrinks = [...rewards.rewards.drinks].sort((a, b) => b.tier - a.tier);
	const sortedHygiene = [...rewards.rewards.hygiene].sort((a, b) => b.tier - a.tier);
	const sortedCare = [...(rewards.rewards.care || [])].sort((a, b) => b.tier - a.tier);

	return (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
			onTouchMove={(e) => e.preventDefault()}
		>
			<div
				className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-none animate-[scaleIn_0.3s_ease-out]"
				onClick={(e) => e.stopPropagation()}
				onTouchMove={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="sticky top-0 bg-primary text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
					<h2 className="text-2xl font-bold flex items-center gap-2">
						<Check width={28} height={28} />
						{t('rewards.title')}
					</h2>
					<button
						onClick={onClose}
						className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors text-2xl leading-none"
						aria-label="Close"
					>
						x
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Food Items */}
					{rewards.rewards.food.length > 0 && (
						<div>
							<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
								<Edit width={20} height={20} className="text-primary" />
								{t('rewards.food')} ({t('rewards.items', { count: rewards.rewards.food.reduce((sum, item) => sum + item.quantity, 0) })})
							</h3>
							<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
								{sortedFood.map((item, idx) => (
									<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx} />
								))}
							</div>
						</div>
					)}

					{/* Drink Items */}
					{rewards.rewards.drinks.length > 0 && (
						<div>
							<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
								<Coffee width={20} height={20} className="text-primary" />
								{t('rewards.drinks')} ({t('rewards.items', { count: rewards.rewards.drinks.reduce((sum, item) => sum + item.quantity, 0) })})
							</h3>
							<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
								{sortedDrinks.map((item, idx) => (
									<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length} />
								))}
							</div>
						</div>
					)}

					{/* Hygiene Items */}
					{rewards.rewards.hygiene.length > 0 && (
						<div>
							<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
								<Zap width={20} height={20} className="text-primary" />
								{t('rewards.hygiene')} ({t('rewards.items', { count: rewards.rewards.hygiene.reduce((sum, item) => sum + item.quantity, 0) })})
							</h3>
							<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
								{sortedHygiene.map((item, idx) => (
									<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length + sortedDrinks.length} />
								))}
							</div>
						</div>
					)}

					{/* Care Items */}
					{sortedCare.length > 0 && (
						<div>
							<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
								<Bed width={20} height={20} className="text-primary" />
								{t('rewards.care')} ({t('rewards.items', { count: sortedCare.reduce((sum, item) => sum + item.quantity, 0) })})
							</h3>
							<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
								{sortedCare.map((item, idx) => (
									<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length + sortedDrinks.length + sortedHygiene.length} />
								))}
							</div>
						</div>
					)}

					{/* Bonus Eggs */}
					{rewards.rewards.eggs > 0 && (
						<div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-lg p-4">
							<h3 className="font-bold text-lg mb-2 text-foreground">{t('rewards.bonus')}</h3>
							<div className="flex items-center gap-3 justify-center">
								<div className="relative w-16 h-16">
									<Image src="/pets/egg.png" alt={EGG_ITEM_NAME} fill className="object-contain pixelated" />
								</div>
								<div className="text-center">
									<div className="font-bold text-xl">{EGG_ITEM_NAME}</div>
									<div className="text-sm text-muted-foreground">x{rewards.rewards.eggs}</div>
									<div className="text-sm font-semibold text-yellow-700 mt-1">{t('rewards.luckyFind')}</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="sticky bottom-0 border-t border-secondary bg-white p-4 rounded-b-2xl">
					<button
						onClick={onClose}
						className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors"
					>
						{t('rewards.awesome')}
					</button>
				</div>
			</div>

			<style jsx>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: scale(0.8);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}

				@keyframes scaleIn {
					from {
						opacity: 0;
						transform: scale(0.9);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}

				.pixelated {
					image-rendering: pixelated;
					image-rendering: -moz-crisp-edges;
					image-rendering: crisp-edges;
				}
			`}</style>
		</div>
	);
};
