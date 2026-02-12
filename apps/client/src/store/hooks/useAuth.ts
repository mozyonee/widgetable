'use client';

import api from '@/lib/api';
import { persistor, useAppDispatch, useAppSelector } from '@/store';
import { clearClaims } from '@/features/claims/slices/claimsSlice';
import { clearPets } from '@/features/pets/slices/petsSlice';
import { logout, setAuthenticated, setUserData } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

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
		dispatch(clearPets());
		dispatch(clearClaims());
		dispatch(logout());
		await persistor.purge();
		router.push('/auth');
	};

	return {
		isAuthenticated,
		isLoading,
		checkAuth,
		logout: handleLogout,
	};
};
