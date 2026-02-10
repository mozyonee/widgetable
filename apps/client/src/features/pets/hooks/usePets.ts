import api from '@/lib/api';
import { callError } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserData } from '@/store/slices/userSlice';
import { Pet, PET_UPDATE_INTERVAL } from '@widgetable/types';
import { useCallback, useEffect, useRef, useState } from 'react';

export const usePets = () => {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);
	const [pets, setPets] = useState<Pet[]>([]);
	const [loading, setLoading] = useState(true);

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const loadPets = useCallback(
		async (isInitialLoad = false) => {
			if (!user?._id) return;
			if (isInitialLoad) setLoading(true);
			try {
				const response = await api.get(`/pets/user`);
				setPets(response.data);
			} catch (error: any) {
				callError(error.message);
			} finally {
				if (isInitialLoad) setLoading(false);
			}
		},
		[user?._id]
	);

	useEffect(() => {
		loadPets(true);
	}, [loadPets]);

	useEffect(() => {
		if (!user?._id) return;

		pollingIntervalRef.current = setInterval(() => {
			loadPets();
		}, PET_UPDATE_INTERVAL);

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, [user?._id, loadPets]);

	const addPet = useCallback(async () => {
		try {
			const response = await api.post('/pets');
			setPets((prev) => [...prev, response.data]);

			const userResponse = await api.get('/auth/me');
			dispatch(setUserData(userResponse.data));
		} catch (error: any) {
			const message = error.response?.data?.message;
			if (message?.includes('No eggs available')) {
				callError('You need eggs to add a pet!');
			} else {
				callError(error.message);
			}
		}
	}, [dispatch]);

	return { pets, loading, addPet };
};
