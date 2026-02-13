'use client';

import { useAuth } from '@/store/hooks/useAuth';
import { isValentineCompleted, isValentineSeason } from '@/features/valentine/components/ValentineMinigame';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

const PUBLIC_ROUTES = ['/auth', '/pwa', '/valentine'];

let authCompleted = false;

interface AuthRouteProps {
	children: ReactNode;
}

const AuthRoute = ({ children }: AuthRouteProps) => {
	const router = useRouter();
	const pathname = usePathname();
	const { checkAuth, isAuthenticated } = useAuth();
	const [authChecked, setAuthChecked] = useState(authCompleted || isAuthenticated);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (authCompleted) return;
		checkAuth().then(() => {
			authCompleted = true;
			setAuthChecked(true);
		});
	}, []);

	// Valentine redirect — takes priority over everything
	useEffect(() => {
		if (isValentineSeason() && !isValentineCompleted() && pathname !== '/valentine') {
			router.replace('/valentine');
		}
	}, [pathname, router]);

	// Handle redirects whenever pathname or auth state changes
	useEffect(() => {
		if (!authChecked) return;

		if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
			router.replace('/auth');
		} else if (isAuthenticated && pathname === '/auth') {
			router.replace('/');
		}
	}, [authChecked, isAuthenticated, pathname, router]);

	const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
	const isValentinePage = pathname === '/valentine';
	const shouldShowContent = isValentinePage || (authChecked && (
		(isAuthenticated && !isPublicRoute) ||
		(!isAuthenticated && isPublicRoute)
	));

	useEffect(() => {
		if (shouldShowContent) {
			window.dispatchEvent(new Event('app-loaded'));
		}
	}, [shouldShowContent]);

	// Block rendering while valentine redirect is pending or auth is loading
	const needsValentineRedirect = isValentineSeason() && !isValentineCompleted() && pathname !== '/valentine';

	if (needsValentineRedirect || !shouldShowContent) {
		return (
			<div className="flex flex-col items-center justify-center grow bg-background">
				<div className="flex flex-col items-center gap-4">
					<img src="/pets/egg.png" alt="Loading" className="w-24 h-auto bounce-squash" />
					<div className="flex gap-2">
						<div className="rounded-xs size-3 bg-primary brightness-75 animate-pulse" style={{ animationDelay: '0ms' }} />
						<div className="rounded-xs size-3 bg-primary brightness-75 animate-pulse" style={{ animationDelay: '150ms' }} />
						<div className="rounded-xs size-3 bg-primary brightness-75 animate-pulse" style={{ animationDelay: '300ms' }} />
					</div>
				</div>
			</div>
		);
	}

	return <div className="flex flex-col grow min-h-0">{children}</div>;
};

export default AuthRoute;
