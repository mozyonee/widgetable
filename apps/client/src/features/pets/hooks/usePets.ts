import { useRefreshUser } from '@/features/auth/hooks/useRefreshUser';
import { addPet as addPetAction, setPets } from '@/features/pets/slices/petsSlice';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api, { isAbortError } from '@/lib/api';
import { usePolling } from '@/lib/hooks/usePolling';
import { callError } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { Pet, PET_UPDATE_INTERVAL } from '@widgetable/types';
import { useCallback, useEffect } from 'react';

export const usePets = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);
	const pets = useAppSelector((state) => state.pets.pets);
	const loaded = useAppSelector((state) => state.pets.loaded);
	const refreshUser = useRefreshUser();

	const loadPets = useCallback(async () => {
		if (!user?._id) return;
		try {
			const response = await api.get<Pet[]>(`/pets/user`);
			dispatch(setPets(response.data));
		} catch (error: unknown) {
			if (!isAbortError(error)) callError((error as Error).message);
		}
	}, [user?._id, dispatch]);

	useEffect(() => {
		void loadPets();
	}, [loadPets]);

	usePolling(() => void loadPets(), PET_UPDATE_INTERVAL, !!user?._id);

	const addPet = useCallback(async () => {
		try {
			const response = await api.post<Pet>('/pets');
			dispatch(addPetAction(response.data));
			await refreshUser();
		} catch {
			callError(t('pets.needEggs'));
		}
	}, [dispatch, refreshUser, t]);

	return { pets, loading: !loaded, addPet };
};
