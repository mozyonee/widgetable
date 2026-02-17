import { useTranslation } from '@/i18n/useTranslation';
import { HTTP_STATUS } from '@/config/constants';
import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { usePolling } from '@/lib/hooks/usePolling';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedPet } from '@/features/pets/slices/petsSlice';
import { addCoparentingRequestSent } from '@/store/slices/userSlice';
import { useRefreshUser } from '@/store/hooks/useRefreshUser';
import {
	PetActionCategory,
	PetAnimation,
	PetUpdate,
	User,
	PET_NEED_KEYS,
	PET_THRESHOLDS,
	PET_ACTIONS_BY_CATEGORY,
	PET_UPDATE_INTERVAL,
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
			const response = await api.get(`/pets/${petId}`);
			dispatch(setSelectedPet(response.data));
		} catch (error: any) {
			callError(error.message);
		}
	}, [user?._id, petId, dispatch]);

	useEffect(() => {
		loadPet();
	}, [loadPet]);

	usePolling(loadPet, PET_UPDATE_INTERVAL, !!petId);

	const updatePet = useCallback(
		async (data: PetUpdate, animation?: PetAnimation, actionName?: string) => {
			if (currentAnimation) {
				callError(t('pets.isBusy', { name: pet?.name || '' }));
				return;
			}

			if (animation) {
				setCurrentAnimation(animation);
			}

			try {
				const payload = actionName ? { ...data, actionName } : data;
				const response = await api.patch(`/pets/${pet?._id}`, payload);
				dispatch(setSelectedPet(response.data));

				if (actionName) {
					const action = Object.values(PET_ACTIONS_BY_CATEGORY)
						.flat()
						.find((a) => a.name === actionName);
					if (action?.inventoryCost) {
						await refreshUser();
					}
				}
			} catch (error: any) {
				callError(error.message);
			}
		},
		[pet, currentAnimation, dispatch, refreshUser],
	);

	const deletePet = useCallback(async () => {
		if (!pet?._id) return;

		try {
			const response = await api.delete(`/pets/${pet._id}`);

			if (response.data && response.data.parents && response.data.parents.length > 0) {
				callSuccess(t('pets.noLongerParent', { name: pet.name }));
			}
		} catch (error: any) {
			callError(error.message);
		}
	}, [pet]);

	const sendCoparentingRequest = useCallback(
		async (friendId: string) => {
			if (!pet || !pet._id) return;

			try {
				const { data } = await api.post('/coparenting/requests', {
					recipientId: friendId,
					petId: pet._id,
				});
				const friend = friends.find((f) => f._id === friendId);
				dispatch(addCoparentingRequestSent(data));
				callSuccess(t('invite.sent', { name: friend?.name || '' }));
				setShowShareDropdown(false);
			} catch (error: any) {
				const status = error.response?.status;
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
				const isAlreadyParent = pet.parents.some((parent: any) => getParentId(parent) === friend._id);
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

		updatePet,
		deletePet,
		sendCoparentingRequest,
		setShowShareDropdown,
		setSelectedCategory,
		clearAnimation,

		getMessage,
	};
};
