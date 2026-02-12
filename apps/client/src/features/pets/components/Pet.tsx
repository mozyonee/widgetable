'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { getActionSprite } from '@/data/actionSprites';
import { RewardsModal } from '@/features/claims/components/RewardsModal';
import { ClaimResult } from '@/features/claims/hooks/useClaims';
import UserCard from '@/features/friends/components/UserCard';
import { BackgroundSelector } from '@/features/pets/components/BackgroundSelector';
import PetSprite from '@/features/pets/components/PetSprite';
import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSelectedPet } from '@/features/pets/slices/petsSlice';
import { setUserData } from '@/store/slices/userSlice';
import { Bed, Check, ChevronLeft, Clock, Close, Coffee, Edit, UserPlus, Users, Zap } from '@nsmr/pixelart-react';
import {
	getExpForCurrentLevel,
	getExpForNextLevel,
	PET_ACTIONS_BY_CATEGORY,
	PET_NEEDS_CONFIG,
	PetActionCategory
} from '@widgetable/types';
import Link from 'next/link';
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

const PetPage = () => {
	const router = useRouter();
	const pet = useAppSelector((state) => state.pets.selectedPet);
	const user = useAppSelector((state) => state.user.userData);
	const dispatch = useAppDispatch();
	const [eggTimeLeft, setEggTimeLeft] = useState<string>('');
	const [expeditionTimeLeft, setExpeditionTimeLeft] = useState<string>('');
	const [canClaimExpedition, setCanClaimExpedition] = useState(false);
	const [lastRewards, setLastRewards] = useState<ClaimResult | null>(null);

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
			const remainingSeconds = seconds % 60;

			if (minutes > 0) {
				return `${minutes}m ${remainingSeconds}s`;
			}
			return `${remainingSeconds}s`;
		};

		const updateTimer = () => {
			const hatchTimeMs = new Date(pet.hatchTime!).getTime();
			const now = Date.now();
			const diff = hatchTimeMs - now;

			if (diff <= 0) {
				setEggTimeLeft('Hatching...');
				return;
			}

			setEggTimeLeft(`Hatching in ${formatTime(diff)}`);
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
				callError(`${pet.name} has urgent needs! Take care of ${urgentNeeds.join(', ')} first.`);
				return;
			}
		}

		try {
			const response = await api.post(`/pets/${pet._id}/expedition/start`);
			dispatch(setSelectedPet(response.data));
			callSuccess(`${pet.name} departed on an expedition!`);
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to start expedition');
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

			callSuccess(`${pet.name} returned successfully!`);
		} catch (error: any) {
			callError(error.response?.data?.message || 'Failed to claim rewards');
		}
	};

	// Get background ID - use random if not set (memoized to prevent flickering)
	const backgroundId = useMemo(() => {
		if (pet?.background != null) {
			return pet.background;
		}
		return Math.floor(Math.random() * 20) + 1;
	}, [pet?.background, pet?._id]);

	// Save background to database
	const handleBackgroundSelect = (backgroundId: number | null) => {
		const newBackground = backgroundId ?? Math.floor(Math.random() * 20) + 1;
		updatePet({ background: newBackground });
	};

	if (!pet) return null;

	const isEgg = pet.isEgg;

	// Generate action categories dynamically from configuration
	const actionCategories = useMemo(
		() =>
			Object.values(PetActionCategory).map((category) => ({
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
			})),
		[pet.needs, user?.inventory, updatePet],
	);

	const selectedActions = actionCategories.find((cat) => cat.categoryName === selectedCategory)?.actions || [];

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
					<Button style={`w-fit aspect-square`} variant="ghost" size="sm" onClick={() => router.back()}>
						<ChevronLeft width={25} height={25} className="text-primary" />
					</Button>

					<div className="flex flex-col items-center gap-1 overflow-hidden w-full">
						{isEgg ? (
							<h2 className="font-bold text-3xl text-foreground px-2">Egg</h2>
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
									<span className="font-semibold">Level {pet.level}</span>
									<span>•</span>
									<span>
										{pet.experience - getExpForCurrentLevel(pet.level)}/{getExpForNextLevel(pet.level)} XP
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

					<div className="flex items-center gap-1 justify-self-end flex-wrap justify-end">
						{pet._id && (
							<BackgroundSelector
								petId={pet._id}
								onSelect={handleBackgroundSelect}
								currentBackground={backgroundId}
							/>
						)}

						<Dropdown
							isOpen={showShareDropdown}
							onClose={() => setShowShareDropdown(false)}
							trigger={
								<Button
									style={`aspect-square w-fit`}
									variant="ghost"
									size="sm"
									onClick={() => setShowShareDropdown(!showShareDropdown)}
								>
									<UserPlus width={20} height={20} className="text-primary" />
								</Button>
							}
							items={availableFriends.map((friend: any) => ({
								id: friend._id!,
								disabled: friend.hasPendingRequest,
								content: (
									<div className={friend.hasPendingRequest ? 'opacity-50 cursor-not-allowed' : ''}>
										<UserCard
											user={friend}
											variant="nested"
											actions={
												friend.hasPendingRequest && (
													<Clock width={20} height={20} className="text-secondary" />
												)
											}
										/>
									</div>
								),
								onClick: () => {
									if (!friend.hasPendingRequest) {
										sendCoparentingRequest(friend._id!);
									}
								},
							}))}
							emptyMessage={
								<div className="flex flex-col items-center gap-2">
									<span className="text-secondary">No friends can be invited</span>
									<Link href="/friends" className="text-primary font-semibold hover:underline">
										Find more friends
									</Link>
								</div>
							}
							className="w-80"
						/>

						<Button style={`aspect-square w-fit`} variant="danger" size="sm" onClick={async () => { await deletePet(); router.back(); }}>
							<Close width={20} height={20} className="text-danger" />
						</Button>
					</div>
				</div>

				{/* Content Area */}
				<div
					className="flex-1 flex flex-col gap-5 items-center justify-center overflow-y-auto overflow-x-hidden py-8 px-4"

				>
					{pet.isOnExpedition ? (
						/* Expedition Status Display */
						<div className="flex flex-col items-center justify-center gap-4 py-8">
							<div className="bg-white rounded-2xl p-6 shadow-md border border-secondary/20 flex flex-col items-center gap-4">
								<Clock width={64} height={64} className="text-primary" />
								<div className="text-2xl font-bold text-center text-foreground">
									{canClaimExpedition ? `${pet.name} is back from an expedition!` : `${pet.name} is on an expedition`}
								</div>
								{canClaimExpedition ? (
									<Button onClick={handleClaimExpedition} size="lg" style="px-8">
										<Check width={20} height={20} className="inline mr-2" />
										Claim Rewards
									</Button>
								) : (
									<div className="text-xl text-secondary">
										Will return in {expeditionTimeLeft}
									</div>
								)}
							</div>
						</div>
					) : (
						<>
							<div className="relative inline-block max-w-[80vw] sm:max-w-md" style={{ minHeight: '44px' }}>
								{!currentAnimation && (
									<>
										{/* Bubble */}
										<div className="bg-white border-2 border-primary rounded-xl px-4 py-2 text-xl break-words text-center">
											{isEgg ? eggTimeLeft : getMessage()}
										</div>

										{/* Tail */}
										<svg
											width="24"
											height="14"
											viewBox="0 0 24 14"
											className="absolute left-1/2 -translate-x-1/2 -bottom-[12px]"
										>
											<path
												d="M2 0 L12 10 L22 0"
												fill="white"
												stroke="var(--primary)"
												strokeWidth="2"
												strokeLinejoin="round"
											/>
										</svg>
									</>
								)}
							</div>

							<div className="relative h-[200px] flex items-end justify-center overflow-hidden">
								<PetSprite height={200} pet={pet} animation={currentAnimation} onAnimationEnd={clearAnimation} />
							</div>
						</>
					)}
				</div>

				{/* Action Menu */}
				<div className="bg-white backdrop-blur-sm rounded-t-2xl shadow-md border-t border-secondary/20 h-[40dvh] flex flex-col flex-shrink-0">
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
									title={category.categoryName}
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
						{!isEgg && !pet.isOnExpedition && !hasUrgentNeeds && (
							<Button
								onClick={handleStartExpedition}
								disabled={!!currentAnimation || hasUrgentNeeds}
								variant="primary"
								size="lg"
								style={`w-full mb-4 ${hasUrgentNeeds ? 'opacity-50' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold`}
							>
								<Clock width={20} height={20} className="inline mr-2" />
								Send on Expedition
							</Button>
						)}
						<div className="grid grid-cols-3 gap-2">
							{selectedActions.map((action) => (
								<button
									key={action.name}
									onClick={action.onClick}
									disabled={isEgg || pet.isOnExpedition || !!currentAnimation || action.isDisabled}
									className={`
									flex flex-col items-center gap-1 p-2 rounded-lg border-2 bg-white
									${getTierColor(action.inventoryCost)}
									${isEgg || pet.isOnExpedition || currentAnimation || action.isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
									transition-colors
								`}
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
									<div className="text-sm font-semibold text-center text-foreground">{action.name}</div>
									{action.inventoryCost !== undefined && (
										<div className="text-xs text-muted-foreground">x{action.inventoryCount}</div>
									)}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{lastRewards && <RewardsModal rewards={lastRewards} onClose={() => setLastRewards(null)} />}
		</>
	);
};

export default PetPage;
