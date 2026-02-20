'use client';

import { Modal } from '@/components/ui/Modal';
import { ICON_SIZES } from '@/config/constants';
import { getActionSprite } from '@/data/actionSprites';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { Bed, Check, Coffee, Edit, Zap } from '@nsmr/pixelart-react';
import { ClaimResult, EGG_ITEM_NAME, ItemReward, ItemTier } from '@widgetable/types';
import Image from 'next/image';

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

const ItemDisplay = ({ item, index }: { item: ItemReward; index: number; }) => {
	const { t } = useTranslation();
	const spritePath = getActionSprite(item.name);

	return (
		<div
			className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 bg-surface ${getTierColor(item.tier)} animate-[fadeIn_0.3s_ease-out]`}
			style={{ animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
		>
			{spritePath && (
				<div className="relative w-12 h-12">
					<Image src={spritePath} alt={item.name} fill className="object-contain pixelated" />
				</div>
			)}
			<div className="text-xs font-semibold text-center">{t(`action.${item.name}`)}</div>
			<div className="text-xs text-muted-foreground">x{item.quantity}</div>
		</div>
	);
};

export const RewardsModal = ({ rewards, onClose }: RewardsModalProps) => {
	const { t } = useTranslation();

	const sortedFood = [...rewards.rewards.food].sort((a, b) => b.tier - a.tier);
	const sortedDrinks = [...rewards.rewards.drinks].sort((a, b) => b.tier - a.tier);
	const sortedHygiene = [...rewards.rewards.hygiene].sort((a, b) => b.tier - a.tier);
	const sortedCare = [...(rewards.rewards.care || [])].sort((a, b) => b.tier - a.tier);

	return (
		<Modal
			isOpen
			onClose={onClose}
			title={t('rewards.title')}
			titleIcon={<Check width={ICON_SIZES.XL} height={ICON_SIZES.XL} />}
			maxWidth="2xl"
			lockScroll
			preventTouchMove
			contentClassName="p-6 space-y-6"
			footer={
				<button
					onClick={onClose}
					className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors"
				>
					{t('rewards.awesome')}
				</button>
			}
		>
			{rewards.rewards.food.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Edit width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('rewards.food')} ({t('rewards.items', { count: rewards.rewards.food.reduce((sum, item) => sum + item.quantity, 0) })})
					</h3>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{sortedFood.map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx} />
						))}
					</div>
				</div>
			)}

			{rewards.rewards.drinks.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Coffee width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('rewards.drinks')} ({t('rewards.items', { count: rewards.rewards.drinks.reduce((sum, item) => sum + item.quantity, 0) })})
					</h3>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{sortedDrinks.map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length} />
						))}
					</div>
				</div>
			)}

			{rewards.rewards.hygiene.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Zap width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('rewards.hygiene')} ({t('rewards.items', { count: rewards.rewards.hygiene.reduce((sum, item) => sum + item.quantity, 0) })})
					</h3>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{sortedHygiene.map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length + sortedDrinks.length} />
						))}
					</div>
				</div>
			)}

			{sortedCare.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Bed width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('rewards.care')} ({t('rewards.items', { count: sortedCare.reduce((sum, item) => sum + item.quantity, 0) })})
					</h3>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{sortedCare.map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length + sortedDrinks.length + sortedHygiene.length} />
						))}
					</div>
				</div>
			)}

			{(rewards.rewards.valentines?.length ?? 0) > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<img src="/valentine/red_heard.png" alt="" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
						{t('rewards.valentines')} ({t('rewards.items', { count: rewards.rewards.valentines!.reduce((sum, item) => sum + item.quantity, 0) })})
					</h3>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
						{[...rewards.rewards.valentines!].sort((a, b) => b.tier - a.tier).map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx} />
						))}
					</div>
				</div>
			)}

			{rewards.rewards.eggs > 0 && (
				<div className="bg-accent/10 border-2 border-accent rounded-lg p-4">
					<h3 className="font-bold text-lg mb-2 text-foreground">{t('rewards.bonus')}</h3>
					<div className="flex items-center gap-3 justify-center">
						<div className="relative w-16 h-16">
							<Image src="/pets/egg.png" alt={EGG_ITEM_NAME} fill className="object-contain pixelated" />
						</div>
						<div className="text-center">
							<div className="font-bold text-xl">{EGG_ITEM_NAME}</div>
							<div className="text-sm text-muted-foreground">x{rewards.rewards.eggs}</div>
							<div className="text-sm font-semibold text-foreground mt-1">{t('rewards.luckyFind')}</div>
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
};
