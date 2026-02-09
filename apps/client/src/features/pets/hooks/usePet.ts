import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { addCoparentingRequestSent, setUserData } from '@/store/slices/userSlice';
import {
	PetActionCategory,
	PetAnimation,
	PetUpdate,
	User,
	PET_NEED_KEYS,
	STAT_THRESHOLD,
	PET_ACTIONS_BY_CATEGORY,
} from '@widgetable/types';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PetContext } from '../context/PetContext';
import { PET_POLLING_INTERVAL } from '../utils/constants';
import { getParentId, getParentNames, getPetMessage } from '../utils/functions';

export const usePet = () => {
	const { pet, setPet } = useContext(PetContext);

	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);
	const coparentingRequests = useAppSelector((state) => state.user.coparentingRequests ?? { sent: [], received: [] });

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const cachedMessageRef = useRef({ message: '', urgentNeeds: '' });

	const [friends, setFriends] = useState<User[]>([]);
	const [showShareDropdown, setShowShareDropdown] = useState(false);
	const [currentAnimation, setCurrentAnimation] = useState<PetAnimation>();
	const [selectedCategory, setSelectedCategory] = useState<PetActionCategory>(PetActionCategory.FEED);

	// Fetches

	const loadPet = useCallback(async () => {
		if (!user?._id || !pet?._id) return;
		try {
			const response = await api.get(`/pets/${pet._id}`);
			setPet(response.data);
		} catch (error: any) {
			callError(error.message);
		}
	}, [user?._id, pet?._id, setPet]);

	const loadFriends = useCallback(async () => {
		try {
			const response = await api.get('/friends');
			setFriends(response.data);
		} catch {
			// Silent fail - friends list is optional for this feature
		}
	}, []);

	// Initial load
	useEffect(() => {
		loadPet();
	}, [user?._id, pet?._id, loadPet]);

	useEffect(() => {
		loadFriends();
	}, [loadFriends]);

	// Polling mechanism to keep pet stats synced with server
	useEffect(() => {
		if (!pet?._id) return;

		pollingIntervalRef.current = setInterval(() => {
			loadPet();
		}, PET_POLLING_INTERVAL);

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, [pet?._id, loadPet]);

	// Actions

	const updatePet = useCallback(
		async (data: PetUpdate, animation?: PetAnimation, actionName?: string) => {
			if (currentAnimation) {
				callError(`${pet?.name} is busy`);
				return;
			}

			if (animation) {
				setCurrentAnimation(animation);
			}

			try {
				const payload = actionName ? { ...data, actionName } : data;
				const response = await api.patch(`/pets/${pet?._id}`, payload);
				setPet(response.data);

				// If action consumed inventory, refetch user data to update inventory count
				if (actionName) {
					const action = Object.values(PET_ACTIONS_BY_CATEGORY)
						.flat()
						.find((a) => a.name === actionName);
					if (action?.inventoryCost) {
						const userResponse = await api.get('/auth/me');
						dispatch(setUserData(userResponse.data));
					}
				}
			} catch (error: any) {
				callError(error.message);
			}
		},
		[pet, currentAnimation, setPet, dispatch],
	);

	const deletePet = useCallback(async () => {
		if (!pet?._id) return;

		try {
			const response = await api.delete(`/pets/${pet._id}`);

			if (response.data && response.data.parents && response.data.parents.length > 0) {
				callSuccess(`You no longer parent ${pet.name}`);
			}

			setPet(undefined);
		} catch (error: any) {
			callError(error.message);
		}
	}, [pet, setPet]);

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
				callSuccess(`Coparenting invitation sent to ${friend?.name}`);
				setShowShareDropdown(false);
			} catch (error: any) {
				const status = error.response?.status;
				let errorMessage = 'Failed to send coparenting invitation';

				if (status === 404) {
					errorMessage = 'User or pet not found';
				} else if (status === 400) {
					errorMessage = 'Cannot send coparenting request';
				}

				callError(errorMessage);
			}
		},
		[pet, friends, dispatch],
	);

	// Computed values

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

		const urgentNeeds = PET_NEED_KEYS.filter((key) => pet.needs[key] < STAT_THRESHOLD)
			.sort()
			.join(',');

		const needsChanged = urgentNeeds !== cachedMessageRef.current.urgentNeeds;

		if (needsChanged || !cachedMessageRef.current.message) {
			cachedMessageRef.current = {
				urgentNeeds,
				message: getPetMessage(pet, user?.name),
			};
		}

		return cachedMessageRef.current.message;
	}, [pet, user?.name]);

	const clearAnimation = useCallback(() => {
		setCurrentAnimation(undefined);
	}, []);

	return {
		// State
		availableFriends,
		parentNames,
		showShareDropdown,
		currentAnimation,
		selectedCategory,

		// Actions
		updatePet,
		deletePet,
		sendCoparentingRequest,
		setShowShareDropdown,
		setSelectedCategory,
		clearAnimation,

		// Helpers
		getMessage,
	};
};
