import { setUserData } from '@/features/auth/slices/userSlice';
import api from '@/lib/api';
import { useAppDispatch } from '@/store';
import { User } from '@widgetable/types';
import { useCallback } from 'react';

export const useRefreshUser = () => {
	const dispatch = useAppDispatch();

	const refreshUser = useCallback(async () => {
		const userResponse = await api.get<User>('/auth/me');
		dispatch(setUserData(userResponse.data));
	}, [dispatch]);

	return refreshUser;
};
