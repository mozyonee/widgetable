import { addPet as addPetAction, setPets } from '@/features/pets/slices/petsSlice';
import api, { isAbortError } from '@/lib/api';
import { callError } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserData } from '@/store/slices/userSlice';
import { PET_UPDATE_INTERVAL } from '@widgetable/types';
import { useCallback, useEffect, useRef } from 'react';

export const usePets = () => {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);
	const pets = useAppSelector((state) => state.pets.pets);
	const loaded = useAppSelector((state) => state.pets.loaded);

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const loadPets = useCallback(
		async () => {
			if (!user?._id) return;
			try {
				const response = await api.get(`/pets/user`);
				dispatch(setPets(response.data));
			} catch (error: any) {
				if (!isAbortError(error)) callError(error.message);
			}
		},
		[user?._id, dispatch],
	);

	useEffect(() => {
		loadPets();
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
			dispatch(addPetAction(response.data));

			const userResponse = await api.get('/auth/me');
			dispatch(setUserData(userResponse.data));
		} catch (error: any) {
			callError('You need eggs to add a pet!');
		}
	}, [dispatch]);

	return { pets, loading: !loaded, addPet };
};
