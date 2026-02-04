'use client';

import api from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout, setAuthenticated, setUserData } from '@/store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '@/store';

const PUBLIC_ROUTES = ['/auth'];

export const useAuth = () => {
	const router = useRouter();
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const { isAuthenticated } = useAppSelector((state) => state.user);

	const checkAuth = async () => {
		try {
			setIsLoading(true);
			const response = await api.get('/auth/me').catch((error) => console.log(error));
			const hasValidSession = !!response?.data;

			dispatch(setAuthenticated(hasValidSession));
			dispatch(setUserData(response?.data));

			setIsLoading(false);
			return hasValidSession;
		} catch (error) {
			console.error('Error checking authentication:', error);
			dispatch(setAuthenticated(false));
			dispatch(setUserData(null));
			setIsLoading(false);
			return false;
		}
	};

	const handleLogout = async () => {
		try {
			await api.post('/auth/logout');
			dispatch(logout());
			router.push('/auth');
		} catch (error) {
			console.error('Error during logout:', error);

			dispatch(logout());
			router.push('/auth');
		}
	};

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

	return {
		isAuthenticated,
		isLoading,
		checkAuth,
		logout: handleLogout,
	};
};
