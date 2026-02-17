'use client';

import { useCountdown } from '@/lib/hooks/useCountdown';

interface ExpeditionTimerProps {
	returnTime?: Date;
}

export const ExpeditionTimer = ({ returnTime }: ExpeditionTimerProps) => {
	const { timeLeft, isReady } = useCountdown(returnTime);

	const displayText = isReady ? 'Ready to claim!' : `Returns in ${timeLeft}`;

	return (
		<div className={`text-sm ${isReady ? 'text-green-600 font-semibold' : 'text-secondary'}`}>{displayText}</div>
	);
};
