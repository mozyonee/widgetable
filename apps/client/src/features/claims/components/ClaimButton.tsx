'use client';

import { Button } from '@/components/ui/Button';
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
	const isClaiming = claimingType === type;

	const getButtonText = () => {
		if (isClaiming) return 'Collecting...';

		switch (type) {
			case 'daily':
				return available ? 'Daily Care Package' : 'Care Package';
			case 'quick':
				return available ? 'Quick Care Package' : 'Care Package';
			case 'debug':
				return 'Debug Claim';
			default:
				return 'Claim Rewards';
		}
	};

	const getIcon = () => {
		if (isClaiming || available) {
			return <Check width={24} height={24} className="text-white" />;
		}
		return <Clock width={24} height={24} className="text-secondary" />;
	};

	return (
		<div className="flex flex-col gap-1">
			<Button
				onClick={onClaim}
				disabled={!available || isClaiming}
				className={` ${available && !isClaiming ? 'animate-pulse shadow-lg hover:shadow-xl' : ''}`}
			>
				<div className='flex items-center justify-center gap-2 w-full'>
					<span>{getIcon()}</span>
					<span>{getButtonText()}</span>
				</div>
			</Button>
			{!available && !isClaiming && (
				<div className="flex items-center justify-between text-sm px-2">
					<span className="text-muted-foreground">Next in:</span>
					<ClaimTimer nextClaimTime={nextClaimTime} />
				</div>
			)}
		</div>
	);
};
