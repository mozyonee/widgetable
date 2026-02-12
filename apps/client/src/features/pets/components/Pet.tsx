'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { getActionSprite } from '@/data/actionSprites';
import { RewardsModal } from '@/features/claims/components/RewardsModal';
import { ClaimResult } from '@/features/claims/hooks/useClaims';
import { BackgroundSelector } from '@/features/pets/components/BackgroundSelector';
import { InviteModal } from '@/features/pets/components/InviteModal';
import PetSprite from '@/features/pets/components/PetSprite';
import { setSelectedPet } from '@/features/pets/slices/petsSlice';
import { useTranslation } from '@/i18n/useTranslation';
import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useImagesLoaded } from '@/lib/useImagesLoaded';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserData } from '@/store/slices/userSlice';
import { Bed, Check, ChevronLeft, Clock, Close, Coffee, Edit, Image, Menu, Trash, UserPlus, Users, Zap } from '@nsmr/pixelart-react';

import {
	getExpForCurrentLevel,
	getExpForNextLevel,
	PET_ACTIONS_BY_CATEGORY,
	PET_NEEDS_CONFIG,
	PetActionCategory
} from '@widgetable/types';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePet } from '../hooks/usePet';

const getTierColor = (tier?: number): string => {
	switch (tier) {
		case 1:
			return 'border-gray-400/50';
		case 2:
			return 'border-green-500/50';
		case 3:
			return 'border-blue-500/50';
		case 4:
			return 'border-purple-500/50';
		default:
			return 'border-gray-400/50';
	}
};

const actionBarBtnClass = 'flex items-center justify-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-secondary/20 shadow-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const PetPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const pet = useAppSelector((state) => state.pets.selectedPet);
	const user = useAppSelector((state) => state.user.userData);
	const dispatch = useAppDispatch();
	const [eggTimeLeft, setEggTimeLeft] = useState<string>('');
	const [expeditionTimeLeft, setExpeditionTimeLeft] = useState<string>('');
	const [canClaimExpedition, setCanClaimExpedition] = useState(false);
	const [lastRewards, setLastRewards] = useState<ClaimResult | null>(null);
	const [bgSelectorOpen, setBgSelectorOpen] = useState(false);
	const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

	const {
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
	} = usePet();

	// Egg timer
	useEffect(() => {
		if (!pet?.isEgg || !pet.hatchTime) return;

		const formatTime = (milliseconds: number): string => {
			const seconds = Math.floor(milliseconds / 1000);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);

			if (hours > 0) return `${hours}h`;
			if (minutes > 0) return `${minutes}m`;
			return `${seconds}s`;
		};

		const updateTimer = () => {
			const hatchTimeMs = new Date(pet.hatchTime!).getTime();
			const now = Date.now();
			const diff = hatchTimeMs - now;

			if (diff <= 0) {
				setEggTimeLeft(t('pets.hatching'));
				return;
			}

			setEggTimeLeft(t('pets.hatchingIn', { time: formatTime(diff) }));
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [pet?.isEgg, pet?.hatchTime]);

	// Expedition timer
	useEffect(() => {
		if (!pet?.isOnExpedition || !pet.expeditionReturnTime) {
			setExpeditionTimeLeft('');
			setCanClaimExpedition(false);
			return;
		}

		const updateTimer = () => {
			const now = new Date().getTime();
			const target = new Date(pet.expeditionReturnTime!).getTime();
			const diff = target - now;

			if (diff <= 0) {
				setExpeditionTimeLeft('');
				setCanClaimExpedition(true);
				return;
			}

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

			if (hours > 0) {
				setExpeditionTimeLeft(`${hours}h ${minutes}m`);
			} else {
				setExpeditionTimeLeft(`${minutes}m`);
			}
			setCanClaimExpedition(false);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [pet?.isOnExpedition, pet?.expeditionReturnTime]);

	// Check if pet has urgent needs (any need below 30)
	const hasUrgentNeeds = pet?.needs
		? pet.needs.hunger < 30 ||
		pet.needs.thirst < 30 ||
		pet.needs.hygiene < 30 ||
		pet.needs.energy < 30 ||
		pet.needs.toilet < 30
		: false;

	// Expedition handlers
	const handleStartExpedition = async () => {
		if (!pet?._id) return;

		// Check for urgent needs before allowing expedition
		if (pet.needs) {
			const urgentNeeds = [];
			if (pet.needs.hunger < 30) urgentNeeds.push('hunger');
			if (pet.needs.thirst < 30) urgentNeeds.push('thirst');
			if (pet.needs.hygiene < 30) urgentNeeds.push('hygiene');
			if (pet.needs.energy < 30) urgentNeeds.push('energy');
			if (pet.needs.toilet < 30) urgentNeeds.push('toilet');

			if (urgentNeeds.length > 0) {
				callError(t('pets.urgentNeeds', { name: pet.name, needs: urgentNeeds.join(', ') }));
				return;
			}
		}

		try {
			const response = await api.post(`/pets/${pet._id}/expedition/start`);
			dispatch(setSelectedPet(response.data));
			callSuccess(t('pets.departedExpedition', { name: pet.name }));
		} catch (error: any) {
			const status = error.response?.status;
			if (status === 422) callError(t('pets.expeditionEggError'));
			else if (status === 409) callError(t('pets.expeditionSlotsFull'));
			else callError(t('pets.failedStartExpedition'));
		}
	};

	const handleClaimExpedition = async () => {
		if (!pet?._id) return;
		try {
			const rewards = await api.post(`/pets/${pet._id}/expedition/claim`);
			setLastRewards(rewards.data);

			// Refresh user inventory
			const userResponse = await api.get('/auth/me');
			dispatch(setUserData(userResponse.data));

			callSuccess(t('pets.returnedSuccess', { name: pet.name }));
		} catch (error: any) {
			callError(t('pets.failedClaimRewards'));
		}
	};

	// Get background ID - use random if not set (memoized to prevent flickering)
	const backgroundId = useMemo(() => {
		if (pet?.background != null) {
			return pet.background;
		}
		return Math.floor(Math.random() * 20) + 1;
	}, [pet?.background, pet?._id]);

	const bgUrl = backgroundId ? `/backgrounds/${backgroundId}.png` : '';
	const bgLoaded = useImagesLoaded(useMemo(() => [bgUrl], [bgUrl]));

	// Save background to database
	const handleBackgroundSelect = (backgroundId: number | null) => {
		const newBackground = backgroundId ?? Math.floor(Math.random() * 20) + 1;
		updatePet({ background: newBackground });
	};

	// Generate action categories dynamically from configuration
	const actionCategories = useMemo(
		() => {
			if (!pet) return [];
			return Object.values(PetActionCategory).map((category) => ({
				categoryName: category,
				actions: PET_ACTIONS_BY_CATEGORY[category].map((action) => {
					const needConfig = PET_NEEDS_CONFIG[action.needKey];
					const currentNeedValue = pet.needs[action.needKey];
					const newValue = action.value === 'increment' ? currentNeedValue + action.amount : action.value;
					const inventoryCount = action.inventoryCost !== undefined ? user?.inventory?.[action.name] ?? 0 : Infinity;
					const isNeedTooHigh = currentNeedValue > 60;
					const isDisabled = inventoryCount === 0 || isNeedTooHigh;
					return {
						name: action.name,
						sprite: getActionSprite(action.name),
						inventoryCost: action.inventoryCost,
						inventoryCount,
						isDisabled,
						onClick: () => updatePet(
							{ needs: { [action.needKey]: newValue } },
							needConfig.animation,
							action.name
						),
					};
				}),
			}));
		},
		[pet?.needs, user?.inventory, updatePet],
	);

	const selectedActions = actionCategories.find((cat) => cat.categoryName === selectedCategory)?.actions || [];

	if (!pet || !bgLoaded) return null;

	const isEgg = pet.isEgg;

	return (
		<>
			<div className="h-full flex flex-col overflow-hidden"
				style={{
					backgroundImage: `url(/backgrounds/${backgroundId}.png)`,
					backgroundSize: 'cover',
					backgroundPosition: 'center calc(100% - 40dvh + 50px)',
					backgroundRepeat: 'no-repeat',
				}}
			>
				{/* Header */}
				<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full p-4 flex-shrink-0 bg-white backdrop-blur-sm rounded-b-2xl shadow-md border-b border-secondary/20">
					<Button style="w-fit aspect-square" variant="ghost" size="sm" onClick={() => router.back()}>
						<ChevronLeft width={25} height={25} className="text-primary" />
					</Button>

					<div className="flex flex-col items-center gap-1 overflow-hidden w-full">
						{isEgg ? (
							<h2 className="font-bold text-3xl text-foreground px-2">{t('pets.egg')}</h2>
						) : (
							<>
								<InputTextHidden
									id={`pet-name-${pet._id}`}
									inputStyles="font-bold text-3xl text-foreground justify-self-center px-2 truncate"
									placeholder={pet.name}
									value={pet.name}
									maxLength={16}
									onChange={(e) => {
										updatePet({ name: e.target.value });
									}}
								/>
								<div className="flex items-center gap-2 text-lg text-secondary">
									<span className="font-semibold">{t('pets.level', { level: pet.level })}</span>
									<span>•</span>
									<span>
										{t('pets.xp', { current: pet.experience - getExpForCurrentLevel(pet.level), next: getExpForNextLevel(pet.level) })}
									</span>
								</div>
							</>
						)}
						{!isEgg && parentNames.length > 0 && (
							<div className="flex items-center justify-center gap-1 text-secondary text-xs">
								<Users width={12} height={12} />
								{parentNames.join(', ')}
							</div>
						)}
					</div>

					<div className="justify-self-end">
						<Button style="aspect-square w-fit" variant="danger" size="sm" onClick={async () => { await deletePet(); router.back(); }}>
							<Trash width={20} height={20} className="text-danger" />
						</Button>
					</div>
				</div>

				{/* Content Area */}
				<div className="flex-1 flex flex-col gap-5 items-center justify-center overflow-y-auto overflow-x-hidden py-8 px-4">
					{pet.isOnExpedition ? (
						/* Expedition Status Display */
						<div className="flex flex-col items-center justify-center gap-4 py-8">
							<div className="bg-white rounded-2xl p-4 shadow-md border border-secondary/20 flex flex-col items-center gap-2">
								<Clock width={64} height={64} className="text-primary" />
								<div className="text-2xl font-bold text-center text-foreground">
									{canClaimExpedition ? t('pets.backFromExpedition', { name: pet.name }) : t('pets.onExpedition', { name: pet.name })}
								</div>
								{canClaimExpedition ? (
									<Button onClick={handleClaimExpedition} size="lg" style="px-8">
										<Check width={20} height={20} className="inline mr-2" />
										{t('pets.claimRewards')}
									</Button>
								) : (
									<div className="text-xl text-secondary">
										{t('pets.willReturn', { time: expeditionTimeLeft })}
									</div>
								)}
							</div>
						</div>
					) : (
						<>
							<div className="relative inline-block max-w-[80vw] sm:max-w-md" style={{ minHeight: '44px' }}>
								{!currentAnimation && (
									<div className="relative bg-white border-2 border-primary rounded-xl px-4 py-2 text-xl break-words text-center">
										{isEgg ? eggTimeLeft : getMessage()}
										<div className="absolute left-1/2 -translate-x-1/2 -bottom-[12px] w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-primary" />
										<div className="absolute left-1/2 -translate-x-1/2 -bottom-[8px] w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-white" />
									</div>
								)}
							</div>

							<div className="relative h-[200px] w-full flex items-end justify-center">
								<PetSprite height={200} pet={pet} animation={currentAnimation} onAnimationEnd={clearAnimation} />
							</div>
						</>
					)}
				</div>

				{/* Action Menu */}
				<div className="relative bg-white backdrop-blur-sm rounded-t-2xl shadow-md border-t border-secondary/20 h-[40dvh] flex flex-col flex-shrink-0">
					{/* Quick Actions Bar */}
					{!isEgg && (
						<div className="absolute bottom-full right-0 left-0 flex flex-col items-end gap-2 px-4 pb-3 z-10">
							<div className="flex items-center gap-2 w-full flex-wrap">
								{actionsMenuOpen && (
									<>
										<button
											onClick={() => { setBgSelectorOpen(true); setActionsMenuOpen(false); }}
											className={`${actionBarBtnClass} flex-2`}
										>
											<Image width={18} height={18} className="text-primary" />
											<span className="text-sm font-semibold text-foreground">{t('pets.background')}</span>
										</button>

										<button
											onClick={() => { setShowShareDropdown(true); setActionsMenuOpen(false); }}
											className={`${actionBarBtnClass} flex-2`}
										>
											<UserPlus width={18} height={18} className="text-primary" />
											<span className="text-sm font-semibold text-foreground">{t('pets.invite')}</span>
										</button>
									</>
								)}

								<button
									onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
									className={`${actionBarBtnClass} ml-auto ${actionsMenuOpen ? "flex-1" : ""}`}
								>
									{actionsMenuOpen ? (
										<Close width={18} height={18} className="text-primary" />
									) : (
										<Menu width={18} height={18} className="text-primary" />
									)}
								</button>
							</div>

							{!pet.isOnExpedition && !hasUrgentNeeds && (
								<button
									onClick={handleStartExpedition}
									disabled={!!currentAnimation}
									className={`${actionBarBtnClass} w-full justify-center`}
								>
									<Zap width={18} height={18} className="text-primary" />
									<span className="text-sm font-semibold text-foreground">{t('pets.expedition')}</span>
								</button>
							)}
						</div>
					)}
					<div className="flex justify-center px-4 flex-shrink-0 gap-4 border-b border-secondary/20">
						{actionCategories.map((category) => {
							const Icon =
								category.categoryName === 'Feed' ? Edit :
									category.categoryName === 'Drink' ? Coffee :
										category.categoryName === 'Wash' ? Zap :
											Bed;

							const isSelected = selectedCategory === category.categoryName;
							const iconColor = isSelected ? 'var(--primary)' : 'var(--secondary)';

							return (
								<button
									key={category.categoryName}
									className={`px-3 py-2 cursor-pointer transition-colors ${isSelected
										? 'text-primary border-b-2 border-primary'
										: 'text-secondary hover:text-foreground border-b-2 border-transparent'
										}`}
									onClick={() => setSelectedCategory(category.categoryName)}
									title={t(`pets.category.${category.categoryName}`)}
									disabled={isEgg}
								>
									<Icon
										width={28}
										height={28}
										style={{ color: iconColor }}
									/>
								</button>
							);
						})}
					</div>
					<div className="overflow-y-auto p-4">
						<div className="grid grid-cols-3 gap-2">
							{selectedActions.map((action) => (
								<button
									key={action.name}
									onClick={action.onClick}
									disabled={isEgg || pet.isOnExpedition || !!currentAnimation || action.isDisabled}
									className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 bg-white transition-colors ${getTierColor(action.inventoryCost)} ${isEgg || pet.isOnExpedition || currentAnimation || action.isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
								>
									{action.sprite && (
										<div className="relative w-16 h-16">
											<img
												src={action.sprite}
												alt={action.name}
												className="w-full h-full object-contain pixelated"
											/>
										</div>
									)}
									<div className="text-sm font-semibold text-center text-foreground w-full">{t(`action.${action.name}`)}</div>
									{action.inventoryCost !== undefined && (
										<div className="text-xs text-muted-foreground">x{action.inventoryCount}</div>
									)}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			<BackgroundSelector
				isOpen={bgSelectorOpen}
				onClose={() => setBgSelectorOpen(false)}
				onSelect={handleBackgroundSelect}
				currentBackground={backgroundId}
			/>

			<InviteModal
				isOpen={showShareDropdown}
				onClose={() => setShowShareDropdown(false)}
				friends={availableFriends}
				onInvite={(friendId) => sendCoparentingRequest(friendId)}
			/>

			{lastRewards && <RewardsModal rewards={lastRewards} onClose={() => setLastRewards(null)} />}
		</>
	);
};

export default PetPage;
