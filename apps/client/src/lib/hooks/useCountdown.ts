import { useEffect, useState } from 'react';

export interface CountdownResult {
	timeLeft: string;
	isReady: boolean;
	hours: number;
	minutes: number;
	seconds: number;
}

export const useCountdown = (targetDate?: Date, updateInterval = 1000): CountdownResult => {
	const [result, setResult] = useState<CountdownResult>({
		timeLeft: '',
		isReady: false,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		if (!targetDate) {
			setResult({
				timeLeft: '',
				isReady: false,
				hours: 0,
				minutes: 0,
				seconds: 0,
			});
			return;
		}

		const updateCountdown = () => {
			const now = new Date().getTime();
			const target = new Date(targetDate).getTime();
			const diff = target - now;

			if (diff <= 0) {
				setResult({
					timeLeft: '',
					isReady: true,
					hours: 0,
					minutes: 0,
					seconds: 0,
				});
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			setResult({
				timeLeft: `${hours}h ${minutes}m`,
				isReady: false,
				hours,
				minutes,
				seconds,
			});
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, updateInterval);

		return () => clearInterval(interval);
	}, [targetDate, updateInterval]);

	return result;
};
