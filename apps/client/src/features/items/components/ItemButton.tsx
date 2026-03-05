'use client';
import { ICON_SIZES } from '@/config/constants';

import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { Check, Clock } from '@nsmr/pixelart-react';
import { ClaimType } from '@widgetable/types';
import { ItemTimer } from './ItemTimer';

interface ItemButtonProps {
	type: ClaimType;
	available: boolean;
	claimingType: ClaimType | null;
	nextItemTime?: Date;
	onClaim: () => void;
}

export const ItemButton = ({ type, available, claimingType, nextItemTime, onClaim }: ItemButtonProps) => {
	const { t } = useTranslation();
	const isClaiming = claimingType === type;

	const getButtonText = () => {
		if (isClaiming) return t('items.collecting');

		switch (type) {
			case ClaimType.DAILY:
				return available ? t('items.dailyCarePackage') : t('items.carePackage');
			case ClaimType.QUICK:
				return available ? t('items.quickCarePackage') : t('items.carePackage');
			default:
				return t('items.claimItems');
		}
	};

	const getIcon = () => {
		if (isClaiming || available) {
			return <Check width={ICON_SIZES.LG} height={ICON_SIZES.LG} className="text-white" />;
		}
		return <Clock width={ICON_SIZES.LG} height={ICON_SIZES.LG} className="text-white" />;
	};

	return (
		<div className="flex flex-col gap-1">
			<Button
				onClick={onClaim}
				disabled={!available || isClaiming}
				className={` ${available && !isClaiming ? 'animate-pulse shadow-lg hover:shadow-xl' : ''}`}
			>
				<div className="flex items-center justify-center gap-2 w-full">
					<span>{getIcon()}</span>
					<span>{getButtonText()}</span>
				</div>
			</Button>
			{!available && !isClaiming && (
				<div className="flex items-center justify-between text-sm px-2">
					<span className="text-muted-foreground">{t('items.nextIn')}</span>
					<ItemTimer nextItemTime={nextItemTime} />
				</div>
			)}
		</div>
	);
};
