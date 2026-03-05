'use client';

import { Modal } from '@/components/ui/Modal';
import { ICON_SIZES } from '@/config/constants';
import { getItemSprite } from '@widgetable/types';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { Bed, Check, Coffee, Edit, Zap } from '@nsmr/pixelart-react';
import {
	ACTION_AMOUNT_BY_NAME,
	EGG_ITEM_NAME,
	getItemTier,
	ItemResult,
	ItemReward,
	ItemTier,
	VALENTINE_GIFT_ITEMS,
} from '@widgetable/types';
import Image from 'next/image';

interface ItemsModalProps {
	result: ItemResult;
	onClose: () => void;
}

const VALENTINE_TIER_BY_NAME = new Map<string, ItemTier>(VALENTINE_GIFT_ITEMS.map((item) => [item.name, item.tier]));

const getItemTierByName = (name: string): ItemTier => {
	const valentineTier = VALENTINE_TIER_BY_NAME.get(name);
	if (valentineTier !== undefined) return valentineTier;
	return getItemTier(ACTION_AMOUNT_BY_NAME[name] ?? 0);
};

const TIER_COLORS: Record<ItemTier, string> = {
	[ItemTier.BASIC]: 'border-inactive',
	[ItemTier.COMMON]: 'border-tier-common',
	[ItemTier.PREMIUM]: 'border-tier-premium',
	[ItemTier.LEGENDARY]: 'border-tier-legendary',
};

const ItemDisplay = ({ item, index }: { item: ItemReward; index: number }) => {
	const { t } = useTranslation();
	const spritePath = getItemSprite(item.name);

	return (
		<div
			className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 bg-surface ${TIER_COLORS[getItemTierByName(item.name)]} animate-[fadeIn_0.3s_ease-out]`}
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

export const ItemsModal = ({ result, onClose }: ItemsModalProps) => {
	const { t } = useTranslation();

	const sortedFood = [...result.items.food].sort((a, b) => getItemTierByName(b.name) - getItemTierByName(a.name));
	const sortedDrinks = [...result.items.drinks].sort((a, b) => getItemTierByName(b.name) - getItemTierByName(a.name));
	const sortedHygiene = [...result.items.hygiene].sort(
		(a, b) => getItemTierByName(b.name) - getItemTierByName(a.name),
	);
	const sortedCare = [...(result.items.care || [])].sort(
		(a, b) => getItemTierByName(b.name) - getItemTierByName(a.name),
	);

	return (
		<Modal
			isOpen
			onClose={onClose}
			title={t('items.title')}
			titleIcon={<Check width={ICON_SIZES.XL} height={ICON_SIZES.XL} />}
			maxWidth="sm"
			lockScroll
			preventTouchMove
			contentClassName="p-6 space-y-6"
			footer={
				<button
					onClick={onClose}
					className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors"
				>
					{t('items.awesome')}
				</button>
			}
		>
			{result.items.food.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Edit width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('items.food')} (
						{t('items.count', {
							count: result.items.food.reduce((sum, item) => sum + item.quantity, 0),
						})}
						)
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
						{sortedFood.map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx} />
						))}
					</div>
				</div>
			)}

			{result.items.drinks.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Coffee width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('items.drinks')} (
						{t('items.count', {
							count: result.items.drinks.reduce((sum, item) => sum + item.quantity, 0),
						})}
						)
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
						{sortedDrinks.map((item, idx) => (
							<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx + sortedFood.length} />
						))}
					</div>
				</div>
			)}

			{result.items.hygiene.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Zap width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('items.hygiene')} (
						{t('items.count', {
							count: result.items.hygiene.reduce((sum, item) => sum + item.quantity, 0),
						})}
						)
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
						{sortedHygiene.map((item, idx) => (
							<ItemDisplay
								key={`${item.name}-${idx}`}
								item={item}
								index={idx + sortedFood.length + sortedDrinks.length}
							/>
						))}
					</div>
				</div>
			)}

			{sortedCare.length > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<Bed width={ICON_SIZES.MD} height={ICON_SIZES.MD} className="text-primary" />
						{t('items.care')} (
						{t('items.count', { count: sortedCare.reduce((sum, item) => sum + item.quantity, 0) })})
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
						{sortedCare.map((item, idx) => (
							<ItemDisplay
								key={`${item.name}-${idx}`}
								item={item}
								index={idx + sortedFood.length + sortedDrinks.length + sortedHygiene.length}
							/>
						))}
					</div>
				</div>
			)}

			{(result.items.valentines?.length ?? 0) > 0 && (
				<div>
					<h3 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
						<img
							src="/valentine/red_heard.png"
							alt=""
							className="w-5 h-5"
							style={{ imageRendering: 'pixelated' }}
						/>
						{t('items.valentines')} (
						{t('items.count', {
							count: result.items.valentines!.reduce((sum, item) => sum + item.quantity, 0),
						})}
						)
					</h3>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
						{[...result.items.valentines!]
							.sort((a, b) => getItemTierByName(b.name) - getItemTierByName(a.name))
							.map((item, idx) => (
								<ItemDisplay key={`${item.name}-${idx}`} item={item} index={idx} />
							))}
					</div>
				</div>
			)}

			{result.items.eggs > 0 && (
				<div className="bg-accent/10 border-2 border-accent rounded-lg p-4">
					<h3 className="font-bold text-lg mb-2 text-foreground">{t('items.bonus')}</h3>
					<div className="flex items-center gap-3 justify-center">
						<div className="relative w-16 h-16">
							<Image src="/pets/egg.png" alt={EGG_ITEM_NAME} fill className="object-contain pixelated" />
						</div>
						<div className="text-center">
							<div className="font-bold text-xl">{EGG_ITEM_NAME}</div>
							<div className="text-sm text-muted-foreground">x{result.items.eggs}</div>
							<div className="text-sm font-semibold text-foreground mt-1">{t('items.luckyFind')}</div>
						</div>
					</div>
				</div>
			)}
		</Modal>
	);
};
