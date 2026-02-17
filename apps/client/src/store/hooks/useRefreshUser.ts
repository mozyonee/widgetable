import api from '@/lib/api';
import { useAppDispatch } from '@/store';
import { setUserData } from '@/store/slices/userSlice';
import { useCallback } from 'react';

export const useRefreshUser = () => {
	const dispatch = useAppDispatch();

	const refreshUser = useCallback(async () => {
		const userResponse = await api.get('/auth/me');
		dispatch(setUserData(userResponse.data));
	}, [dispatch]);

	return refreshUser;
};
