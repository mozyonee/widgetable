'use client';

import { Button } from '@/components/ui/Button';
import { Check, Clock } from '@nsmr/pixelart-react';
import { ClaimTimer } from './ClaimTimer';

interface ClaimButtonProps {
	type: 'daily' | 'quick' | 'debug';
	available: boolean;
	claiming: boolean;
	nextClaimTime?: Date;
	petCount: number;
	onClaim: () => void;
}

export const ClaimButton = ({ type, available, claiming, nextClaimTime, petCount, onClaim }: ClaimButtonProps) => {
	const getButtonText = () => {
		if (claiming) return 'Collecting...';
		if (petCount === 0) return 'Need Pets First';

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
		if (claiming || available) {
			return <Check width={24} height={24} className="text-white" />;
		}
		return <Clock width={24} height={24} className="text-secondary" />;
	};

	return (
		<div className="flex flex-col gap-1">
			<Button
				onClick={onClaim}
				disabled={!available || claiming || petCount === 0}
				className={` ${available && !claiming && petCount > 0 ? 'animate-pulse shadow-lg hover:shadow-xl' : ''}`}
			>
				<div className='flex items-center justify-center gap-2 w-full'>
					<span>{getIcon()}</span>
					<span>{getButtonText()}</span>
				</div>
			</Button>
			{!available && !claiming && petCount > 0 && (
				<div className="flex items-center justify-between text-sm px-2">
					<span className="text-muted-foreground">Next in:</span>
					<ClaimTimer nextClaimTime={nextClaimTime} />
				</div>
			)}
		</div>
	);
};
