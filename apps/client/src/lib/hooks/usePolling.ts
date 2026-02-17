import { useEffect, useRef } from 'react';

export const usePolling = (callback: () => void, interval: number, enabled = true) => {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		if (!enabled) return;

		const id = setInterval(() => {
			callbackRef.current();
		}, interval);

		return () => clearInterval(id);
	}, [interval, enabled]);
};
