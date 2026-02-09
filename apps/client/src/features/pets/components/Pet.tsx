'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import UserCard from '@/features/friends/components/UserCard';
import PetSprite from '@/features/pets/components/PetSprite';
import { PetContext } from '@/features/pets/context/PetContext';
import { useAppSelector } from '@/store';
import {
	getExpForCurrentLevel,
	getExpForNextLevel,
	PET_ACTIONS_BY_CATEGORY,
	PET_NEEDS_CONFIG,
	PetActionCategory,
} from '@widgetable/types';
import { CircleX, Clock, Triangle, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useContext, useMemo } from 'react';
import { usePet } from '../hooks/usePet';

const PetPage = () => {
	const { pet, setPet } = useContext(PetContext);
	const user = useAppSelector((state) => state.user.userData);

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

	if (!pet) return null;

	const isEgg = pet.isEgg;

	// Generate action categories dynamically from configuration
	const actionCategories = useMemo(
		() =>
			Object.values(PetActionCategory).map((category) => ({
				categoryName: category,
				actions: PET_ACTIONS_BY_CATEGORY[category].map((action) => {
					const needConfig = PET_NEEDS_CONFIG[action.needKey];
					const newValue = action.value === 'increment' ? pet.needs[action.needKey] + action.amount : action.value;
					const inventoryCount = action.inventoryCost !== undefined ? user?.inventory?.[action.name] ?? 0 : Infinity;
					const isDisabled = inventoryCount === 0;
					return {
						name: action.name,
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
		<div className="flex-1 flex flex-col gap-12 items-center">
			<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full">
				<Button style={`w-fit aspect-square`} variant="ghost" size="sm" onClick={() => setPet(undefined)}>
					<Triangle strokeWidth={2} size={25} color="var(--primary)" className="rotate-270" />
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
								onChange={(e) => {
									updatePet({ name: e.target.value });
								}}
							/>
							<div className="flex items-center gap-2 text-sm text-secondary">
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
							<Users size={12} />
							{parentNames.join(', ')}
						</div>
					)}
				</div>

				<div className="flex items-center gap-2 justify-self-end">
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
								<UserPlus strokeWidth={2} size={25} color="var(--primary)" />
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
												<Clock strokeWidth={2} size={20} className="text-secondary" />
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
						<CircleX strokeWidth={2} size={25} color="var(--danger)" />
					</Button>
				</div>
			</div>

			<div className="flex-1 flex flex-col gap-5 items-center justify-center">
				{isEgg ? (
					<div className="flex flex-col items-center gap-4">
						<div className="text-center">
							<p className="text-2xl font-bold text-primary mb-2">Egg Incubating...</p>
							<p className="text-secondary">Your pet will hatch soon!</p>
						</div>
					</div>
				) : (
					<div className="relative inline-block max-w-[80vw] sm:max-w-md" style={{ minHeight: '44px' }}>
						{!currentAnimation && (
							<>
								{/* Bubble */}
								<div className="bg-white border-2 border-primary rounded-xl px-4 py-2 text-base whitespace-nowrap">
									{getMessage()}
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
				)}

				<div className="relative">
					<PetSprite height={300} pet={pet} animation={currentAnimation} onAnimationEnd={clearAnimation} />
				</div>
			</div>

			{!isEgg && (
				<div className="w-full bg-white rounded-2xl p-4 shadow-md border border-secondary/20">
					<div className="flex justify-center border-b border-secondary/20 mb-4">
						{actionCategories.map((category) => (
							<div
								key={category.categoryName}
								className={`px-4 py-2 cursor-pointer font-semibold ${selectedCategory === category.categoryName
									? 'text-primary border-b-2 border-primary'
									: 'text-secondary'
									}`}
								onClick={() => setSelectedCategory(category.categoryName)}
							>
								{category.categoryName}
							</div>
						))}
					</div>
					<div className="grid grid-cols-2 gap-2">
						{selectedActions.map((action) => (
							<Button
								key={action.name}
								onClick={action.onClick}
								variant="ghost"
								size="sm"
								disabled={!!currentAnimation || action.isDisabled}
								style={`${currentAnimation || action.isDisabled ? 'opacity-30 pointer-events-none' : ''}`}
							>
								<span className="flex items-center gap-2 justify-center w-full">
									{action.name}
									{action.inventoryCost !== undefined && (
										<span className="text-secondary">({action.inventoryCount})</span>
									)}
								</span>
							</Button>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default PetPage;
