import api from '@/lib/api';
import { callError } from '@/lib/functions';
import { useAppSelector } from '@/store';
import { Pet } from '@widgetable/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PET_POLLING_INTERVAL } from '../utils/constants';

export const usePets = () => {
	const user = useAppSelector((state) => state.user.userData);
	const [pets, setPets] = useState<Pet[]>([]);
	const [loading, setLoading] = useState(true);

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Fetches

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

	// Initial load
	useEffect(() => {
		loadPets(true);
	}, [loadPets]);

	// Polling mechanism to keep pets stats synced with server
	useEffect(() => {
		if (!user?._id) return;

		pollingIntervalRef.current = setInterval(() => {
			loadPets();
		}, PET_POLLING_INTERVAL);

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, [user?._id, loadPets]);

	// Actions

	const addPet = useCallback(async () => {
		try {
			const response = await api.post('/pets');
			setPets((prev) => [...prev, response.data]);
		} catch (error: any) {
			callError(error.message);
		}
	}, []);

	return {
		// State
		pets,
		loading,

		// Actions
		addPet,
	};
};
