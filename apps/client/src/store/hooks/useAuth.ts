'use client';

import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { logout, setAuthenticated, setUserData } from '@/store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '@/store';

export const useAuth = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const { isAuthenticated } = useAppSelector((state) => state.user);

	const checkAuth = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await api.get('/auth/me').catch(() => null);
			const hasValidSession = !!response?.data;

			dispatch(setAuthenticated(hasValidSession));
			dispatch(setUserData(response?.data));
			setIsLoading(false);

			return hasValidSession;
		} catch (error) {
			dispatch(setAuthenticated(false));
			dispatch(setUserData(null));
			setIsLoading(false);
			return false;
		}
	}, [dispatch]);

	const handleLogout = async () => {
		try {
			await api.post('/auth/logout');
		} catch (error) {
			// Ignore error, logout locally anyway
		} finally {
			dispatch(logout());
			router.push('/auth');
		}
	};

	return {
		isAuthenticated,
		isLoading,
		checkAuth,
		logout: handleLogout,
	};
};
