'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { getActionSprite } from '@/data/actionSprites';
import UserCard from '@/features/friends/components/UserCard';
import { BackgroundSelector } from '@/features/pets/components/BackgroundSelector';
import PetSprite from '@/features/pets/components/PetSprite';
import { PetContext } from '@/features/pets/context/PetContext';
import { useAppSelector } from '@/store';
import {
	getExpForCurrentLevel,
	getExpForNextLevel,
	PET_ACTIONS_BY_CATEGORY,
	PET_NEEDS_CONFIG,
	PetActionCategory
} from '@widgetable/types';
import { Close, Clock, Coffee, Bed, Zap, ChevronLeft, UserPlus, Users, Edit } from '@nsmr/pixelart-react';
import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { usePet } from '../hooks/usePet';

const PetPage = () => {
	const { pet, setPet } = useContext(PetContext);
	const user = useAppSelector((state) => state.user.userData);
	const [eggTimeLeft, setEggTimeLeft] = useState<string>('');

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
		<div className="h-full flex flex-col overflow-hidden"
			style={{
				backgroundImage: `url(/backgrounds/${backgroundId}.png)`,
				backgroundSize: '100% max(65dvh, 100%)',
				backgroundPosition: 'center calc(100% - 35dvh + 15px)',
				backgroundRepeat: 'no-repeat',
			}}
		>
			{/* Header */}
			<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full p-4 flex-shrink-0 bg-white backdrop-blur-sm rounded-b-2xl shadow-md border-b border-secondary/20">
				<Button style={`w-fit aspect-square`} variant="ghost" size="sm" onClick={() => setPet(undefined)}>
					<ChevronLeft width={25} height={25} className="text-primary" />
				</Button>

				<div className="flex flex-col items-center gap-1">
					{isEgg ? (
						<h2 className="font-bold text-3xl text-foreground px-2">Egg</h2>
					) : (
						<>
							<InputTextHidden
								id={`pet-name-${pet._id}`}
								inputStyles="font-bold text-3xl text-foreground justify-self-center px-2"
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

					<Button style={`aspect-square w-fit`} variant="danger" size="sm" onClick={() => deletePet()}>
						<Close width={20} height={20} className="text-danger" />
					</Button>
				</div>
			</div>

			{/* Content Area */}
			<div
				className="flex-1 flex flex-col gap-5 items-center justify-center overflow-y-auto overflow-x-hidden py-8 px-4"

			>
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
			</div>

			{/* Action Menu */}
			<div className="bg-white backdrop-blur-sm rounded-t-2xl shadow-md border-t border-secondary/20 h-[35dvh] flex flex-col flex-shrink-0">
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
					<div className="grid grid-cols-3 gap-2">
						{selectedActions.map((action) => (
							<Button
								key={action.name}
								onClick={action.onClick}
								variant="ghost"
								size="sm"
								disabled={isEgg || !!currentAnimation || action.isDisabled}
								style={`${isEgg || currentAnimation || action.isDisabled ? 'opacity-30 pointer-events-none' : ''} h-auto py-3`}
							>
								<span className="flex flex-col items-center gap-2 h-full w-full">
									<span className="flex items-center gap-1 text-xl">
										{action.name}
										{action.inventoryCost !== undefined && (
											<>{" "}({action.inventoryCount})</>
										)}
									</span>
									{action.sprite && (<div className='flex-1 flex items-end'><img
										src={action.sprite}
										alt={action.name}
										className="w-16 h-16 object-contain"
									/></div>)}
								</span>
							</Button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default PetPage;
