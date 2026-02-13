'use client';

import Footer from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PagesLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	const pathname = usePathname();
	const isPetPage = pathname.startsWith('/pet/');
	const isAuthPage = pathname === '/auth';
	const isValentinePage = pathname === '/valentine';
	const showFooter = !isPetPage && !isAuthPage && !isValentinePage;

	useEffect(() => {
		if (isPetPage) return;

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length !== 1) return;
			const x = e.touches[0].clientX;
			if (x < window.innerWidth * 0.1 || x > window.innerWidth * 0.9) {
				e.preventDefault();
			}
		};

		window.addEventListener('touchstart', handleTouchStart, { passive: false });

		return () => {
			window.removeEventListener('touchstart', handleTouchStart);
		};
	}, [isPetPage]);

	return (
		<div className="flex flex-col grow min-h-0">
			{children}
			{showFooter && <Footer />}
		</div>
	);
};

export default PagesLayout;
