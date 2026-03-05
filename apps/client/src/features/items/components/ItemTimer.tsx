'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

interface ItemTimerProps {
	nextItemTime?: Date;
}

export const ItemTimer = ({ nextItemTime }: ItemTimerProps) => {
	const { timeLeft, isReady } = useCountdown(nextItemTime);

	if (!nextItemTime) return null;

	const displayText = isReady ? 'Ready!' : timeLeft;

	if (!displayText) return null;

	return <span className="text-sm text-muted-foreground">{displayText}</span>;
};
