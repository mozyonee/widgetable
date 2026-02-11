'use client';

import { useEffect, useState } from 'react';

interface ClaimTimerProps {
	nextClaimTime?: Date;
}

export const ClaimTimer = ({ nextClaimTime }: ClaimTimerProps) => {
	const [timeLeft, setTimeLeft] = useState('');

	useEffect(() => {
		if (!nextClaimTime) {
			setTimeLeft('');
			return;
		}

		const updateTimer = () => {
			const now = new Date().getTime();
			const target = new Date(nextClaimTime).getTime();
			const diff = target - now;

			if (diff <= 0) {
				setTimeLeft('Ready!');
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

			setTimeLeft(`${hours}h ${minutes}m`);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [nextClaimTime]);

	if (!timeLeft) return null;

	return <span className="text-sm text-muted-foreground">{timeLeft}</span>;
};
