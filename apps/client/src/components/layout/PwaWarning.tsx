'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PwaWarning = () => {
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (pathname === '/pwa') return;

		const dismissed = sessionStorage.getItem('pwa-warning-dismissed');
		if (dismissed) return;

		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as any).standalone === true;

		if (!isStandalone) {
			router.replace('/pwa');
		}
	}, [pathname, router]);

	return null;
};

export default PwaWarning;
