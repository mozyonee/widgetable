'use client';
import { ICON_SIZES } from '@/config/constants';

import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';
import { Check, Clock } from '@nsmr/pixelart-react';
import { ClaimTimer } from './ClaimTimer';

interface ClaimButtonProps {
	type: 'daily' | 'quick' | 'debug';
	available: boolean;
	claimingType: 'daily' | 'quick' | 'debug' | null;
	nextClaimTime?: Date;
	onClaim: () => void;
}

export const ClaimButton = ({ type, available, claimingType, nextClaimTime, onClaim }: ClaimButtonProps) => {
	const { t } = useTranslation();
	const isClaiming = claimingType === type;

	const getButtonText = () => {
		if (isClaiming) return t('claims.collecting');

		switch (type) {
			case 'daily':
				return available ? t('claims.dailyCarePackage') : t('claims.carePackage');
			case 'quick':
				return available ? t('claims.quickCarePackage') : t('claims.carePackage');
			case 'debug':
				return t('claims.debugClaim');
			default:
				return t('claims.claimRewards');
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
					<span className="text-muted-foreground">{t('claims.nextIn')}</span>
					<ClaimTimer nextClaimTime={nextClaimTime} />
				</div>
			)}
		</div>
	);
};
