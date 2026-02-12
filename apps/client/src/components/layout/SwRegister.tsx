'use client';

import { useEffect } from 'react';

const SwRegister = () => {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js', { scope: '/' });
		}
	}, []);

	return null;
};

export default SwRegister;
