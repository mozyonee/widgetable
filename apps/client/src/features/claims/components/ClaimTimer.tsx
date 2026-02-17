'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

interface ClaimTimerProps {
	nextClaimTime?: Date;
}

export const ClaimTimer = ({ nextClaimTime }: ClaimTimerProps) => {
	const { timeLeft, isReady } = useCountdown(nextClaimTime);

	if (!nextClaimTime) return null;

	const displayText = isReady ? 'Ready!' : timeLeft;

	if (!displayText) return null;

	return <span className="text-sm text-muted-foreground">{displayText}</span>;
};
