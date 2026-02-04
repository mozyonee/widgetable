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
	const { isAuthenticated, checkAuth } = useAuth();

	useEffect(() => {
		const verifyAuth = async () => {
			const isAuthorized = await checkAuth();

			if (!isAuthorized && !PUBLIC_ROUTES.includes(pathname)) {
				router.push('/auth');
			}

			if (isAuthorized && pathname === '/auth') {
				router.push('/');
			}
		};

		verifyAuth();
	}, [pathname]);

	return <div className="flex flex-col min-h-screen">{children}</div>;
}
