'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

interface ExpeditionTimerProps {
	returnTime?: Date;
}

export const ExpeditionTimer = ({ returnTime }: ExpeditionTimerProps) => {
	const { timeLeft, isReady } = useCountdown(returnTime);

	const displayText = isReady ? 'Ready to claim!' : `Returns in ${timeLeft}`;

	return (
		<div className={`text-sm ${isReady ? 'text-success font-semibold' : 'text-secondary'}`}>{displayText}</div>
	);
};
