import { HTTP_STATUS } from '@/config/constants';
import { useRefreshUser } from '@/features/auth/hooks/useRefreshUser';
import { addCoparentingRequestSent } from '@/features/auth/slices/userSlice';
import { setSelectedPet } from '@/features/pets/slices/petsSlice';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api from '@/lib/api';
import { usePolling } from '@/lib/hooks/usePolling';
import { callError, callSuccess } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	PET_ACTIONS_BY_CATEGORY,
	PET_NEED_KEYS,
	PET_THRESHOLDS,
	PET_UPDATE_INTERVAL,
	Pet,
	PetActionCategory,
	PetAnimation,
	Request,
} from '@widgetable/types';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getParentId, getParentNames, getPetMessage } from '../utils/functions';

export const usePet = () => {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const dispatch = useAppDispatch();
	const pet = useAppSelector((state) => state.pets.selectedPet);
	const user = useAppSelector((state) => state.user.userData);
	const friends = useAppSelector((state) => state.user.friends || []);
	const coparentingRequests = useAppSelector((state) => state.user.coparentingRequests ?? { sent: [], received: [] });

	const cachedMessageRef = useRef({ message: '', urgentNeeds: '' });
	const refreshUser = useRefreshUser();

	const [showShareDropdown, setShowShareDropdown] = useState(false);
	const [currentAnimation, setCurrentAnimation] = useState<PetAnimation>();
	const [selectedCategory, setSelectedCategory] = useState<PetActionCategory>(PetActionCategory.FEED);

	const petId = pet?._id || id;

	const loadPet = useCallback(async () => {
		if (!user?._id || !petId) return;
		try {
			const response = await api.get<Pet>(`/pets/${petId}`);
			dispatch(setSelectedPet(response.data));
		} catch (error: unknown) {
			callError((error as Error).message);
		}
	}, [user?._id, petId, dispatch]);

	useEffect(() => {
		void loadPet();
	}, [loadPet]);

	usePolling(() => void loadPet(), PET_UPDATE_INTERVAL, !!petId);

	const updatePet = useCallback(
		async (payload: { name?: string; background?: number; action?: string }, animation?: PetAnimation) => {
			if (currentAnimation) {
				callError(t('pets.isBusy', { name: pet?.name || '' }));
				return;
			}

			if (animation) {
				setCurrentAnimation(animation);
			}

			try {
				const response = await api.patch<Pet>(`/pets/${pet?._id}`, payload);
				dispatch(setSelectedPet(response.data));

				if (payload.action) {
					const action = Object.values(PET_ACTIONS_BY_CATEGORY)
						.flat()
						.find((a) => a.name === payload.action);
					if (action?.inventoryCost) {
						await refreshUser();
					}
				}
			} catch (error: unknown) {
				callError((error as Error).message);
			}
		},
		[pet, currentAnimation, dispatch, refreshUser],
	);

	const deletePet = useCallback(async () => {
		if (!pet?._id) return;

		try {
			const response = await api.delete<Pet>(`/pets/${pet._id}`);

			if (response.data && response.data.parents && response.data.parents.length > 0) {
				callSuccess(t('pets.noLongerParent', { name: pet.name }));
			}
		} catch (error: unknown) {
			callError((error as Error).message);
		}
	}, [pet]);

	const sendCoparentingRequest = useCallback(
		async (friendId: string) => {
			if (!pet || !pet._id) return;

			try {
				const { data } = await api.post<Request>('/coparenting/requests', {
					recipientId: friendId,
					petId: pet._id,
				});
				const friend = friends.find((f) => f._id === friendId);
				dispatch(addCoparentingRequestSent(data));
				callSuccess(t('invite.sent', { name: friend?.name || '' }));
				setShowShareDropdown(false);
			} catch (error: unknown) {
				const status = (error as { response?: { status?: number } }).response?.status;
				let errorMessage = t('invite.failedSend');

				if (status === HTTP_STATUS.NOT_FOUND) {
					errorMessage = t('invite.userNotFound');
				} else if (status === HTTP_STATUS.BAD_REQUEST) {
					errorMessage = t('invite.cannotSend');
				}

				callError(errorMessage);
			}
		},
		[pet, friends, dispatch],
	);

	const availableFriends = useMemo(() => {
		if (!pet) return [];

		return friends
			.filter((friend) => {
				const isAlreadyParent = pet.parents.some(
					(parent) => getParentId(parent as string | { _id: string }) === friend._id,
				);
				return !isAlreadyParent;
			})
			.map((friend) => ({
				...friend,
				hasPendingRequest: coparentingRequests.sent.some(
					(req) => req.metadata?.petId === pet._id && req.recipientId === friend._id,
				),
			}));
	}, [friends, pet, coparentingRequests.sent]);

	const parentNames = useMemo(() => {
		if (!pet) return [];
		return getParentNames(pet, user?.name);
	}, [pet, user?.name]);

	const getMessage = useCallback(() => {
		if (!pet) return '';

		const urgentNeeds = PET_NEED_KEYS.filter((key) => pet.needs[key] < PET_THRESHOLDS.URGENT)
			.sort()
			.join(',');

		const needsChanged = urgentNeeds !== cachedMessageRef.current.urgentNeeds;

		if (needsChanged || !cachedMessageRef.current.message) {
			cachedMessageRef.current = {
				urgentNeeds,
				message: getPetMessage(pet, user?.name, t),
			};
		}

		return cachedMessageRef.current.message;
	}, [pet, user?.name]);

	const clearAnimation = useCallback(() => {
		setCurrentAnimation(undefined);
	}, []);

	return {
		availableFriends,
		parentNames,
		showShareDropdown,
		currentAnimation,
		selectedCategory,

		loadPet,
		updatePet,
		deletePet,
		sendCoparentingRequest,
		setShowShareDropdown,
		setSelectedCategory,
		clearAnimation,

		getMessage,
	};
};
