'use client';

import { useAuth } from '@/store/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

const PUBLIC_ROUTES = ['/auth'];

interface AuthRouteProps {
	children: ReactNode;
}

export default function AuthRoute({ children }: AuthRouteProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { checkAuth } = useAuth();

	useEffect(() => {
		let isMounted = true;

		const verifyAuth = async () => {
			const isAuthorized = await checkAuth();

			if (!isMounted) return;

			if (!isAuthorized && !PUBLIC_ROUTES.includes(pathname)) {
				router.replace('/auth');
				return;
			}

			if (isAuthorized && pathname === '/auth') {
				router.replace('/');
			}
		};

		if (pathname) verifyAuth();

		return () => {
			isMounted = false;
		};
	}, [pathname, checkAuth, router]);

	return <div className="flex flex-col min-h-screen">{children}</div>;
}
