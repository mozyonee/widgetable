'use client';

import { useEffect, useState } from 'react';

interface ExpeditionTimerProps {
	returnTime?: Date;
}

export const ExpeditionTimer = ({ returnTime }: ExpeditionTimerProps) => {
	const [timeLeft, setTimeLeft] = useState('');
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (!returnTime) return;

		const updateTimer = () => {
			const now = new Date().getTime();
			const target = new Date(returnTime).getTime();
			const diff = target - now;

			if (diff <= 0) {
				setTimeLeft('Ready to claim!');
				setIsReady(true);
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			setTimeLeft(`Returns in ${hours}h ${minutes}m`);
			setIsReady(false);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [returnTime]);

	return (
		<div className={`text-sm ${isReady ? 'text-green-600 font-semibold' : 'text-secondary'}`}>
			{timeLeft}
		</div>
	);
};
