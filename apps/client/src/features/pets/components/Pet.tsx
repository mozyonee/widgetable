'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import PetSprite from '@/features/pets/components/PetSprite';
import { PetContext } from '@/features/pets/context/PetContext';
import api from '@/lib/api';
import { callError } from '@/lib/functions';
import { useAppSelector } from '@/store';
import { Pet, PetAnimation } from '@widgetable/types';
import { sample } from 'lodash';
import { CircleX, Triangle } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';

const petReplicas = {
	hygiene: ['I need a bath!'],
	toilet: ['I need to go to the toilet!'],
	hunger: ["I'm hungry!"],
	thirst: ["I'm thirsty!"],
	energy: ["I'm tired!"],
	happy: ["I'm happy!"],
};

const PetPage = () => {
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const user = useAppSelector((state) => state.user.userData);
	const { pet, setPet } = useContext(PetContext);
	const [selectedCategory, setSelectedCategory] = useState('Feed');
	const [currentAnimation, setCurrentAnimation] = useState<PetAnimation>();

	const getMessage = (pet: Pet) => {
		if (pet.hygiene < 30) return sample(petReplicas.hygiene);
		if (pet.toilet < 30) return sample(petReplicas.toilet);
		if (pet.hunger < 30) return sample(petReplicas.hunger);
		if (pet.thirst < 30) return sample(petReplicas.thirst);
		if (pet.energy < 30) return sample(petReplicas.energy);

		return sample(petReplicas.happy);
	};

	const calculateCurrentStats = (pet: Pet) => {
		const now = Date.now();
		const updatedAtDate = pet.updatedAt ? new Date(pet.updatedAt) : new Date();
		const timeDiff = now - updatedAtDate.getTime();
		const intervals = Math.floor(timeDiff / 5000); // 5 second intervals

		if (intervals <= 0) return pet;

		// Decrease stats (adjust rates as needed)
		const hungerDecrease = intervals * 10;
		const thirstDecrease = intervals * 10.2;
		const energyDecrease = intervals * 10.5;
		const hygieneDecrease = intervals * 10.3;
		const toiletDecrease = intervals * 10.2;

		const updatedPet = {
			...pet,
			hunger: Math.max(0, pet.hunger - hungerDecrease),
			thirst: Math.max(0, pet.thirst - thirstDecrease),
			energy: Math.max(0, pet.energy - energyDecrease),
			hygiene: Math.max(0, pet.hygiene - hygieneDecrease),
			toilet: Math.max(0, pet.toilet - toiletDecrease),
			updatedAt: new Date(), // Update the timestamp
		};

		return updatedPet;
	};

	const updatePetStats = () => {
		setPet((currentPet: Pet | undefined) => {
			if (!currentPet) return currentPet;
			return calculateCurrentStats(currentPet);
		});
	};

	useEffect(() => {
		const fetchPet = async () => {
			if (!user?._id) return;
			await api
				.get(`/pets/${pet?._id}`)
				.then((response) => {
					const updatedPet = calculateCurrentStats(response.data);
					setPet(updatedPet);
				})
				.catch((error) => {
					callError(error.message);
				});
		};
		fetchPet();
	}, [user?._id, pet?._id]);

	useEffect(() => {
		if (pet) {
			intervalRef.current = setInterval(updatePetStats, 5000);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [pet?._id]);

	const handleSet = async (data: Partial<Pet>, animation?: PetAnimation) => {
		if (currentAnimation) {
			callError(`${pet?.name} is busy`)
			return;
		}

		if (animation) {
			setCurrentAnimation(animation);
		}

		await api
			.patch(`/pets/${pet?._id}`, data)
			.then((response) => {
				const updatedPet = calculateCurrentStats(response.data);
				setPet(updatedPet);
			})
			.catch((error) => {
				callError(error.message);
			});
	};

	const handleDelete = async (petId: Pet['_id']) => {
		await api
			.delete(`/pets/${petId}`)
			.then(() => {
				setPet(undefined);
			})
			.catch((error) => {
				callError(error.message);
			});
	};

	if (!pet) return null;

	const actionCategories = [
		{
			categoryName: 'Feed',
			actions: [
				{ name: 'Meal', onClick: () => handleSet({ hunger: 100 }, PetAnimation.EAT) },
				{ name: 'Snack', onClick: () => handleSet({ hunger: Math.min(pet.hunger + 30, 100) }, PetAnimation.EAT) },
			],
		},
		{
			categoryName: 'Drink',
			actions: [
				{ name: 'Water', onClick: () => handleSet({ thirst: 100 }, PetAnimation.DRINK) },
				{ name: 'Juice', onClick: () => handleSet({ thirst: Math.min(pet.thirst + 40, 100) }, PetAnimation.DRINK) },
			],
		},
		{
			categoryName: 'Wash',
			actions: [
				{ name: 'Bath', onClick: () => handleSet({ hygiene: 100 }, PetAnimation.BATH) },
				{ name: 'Shower', onClick: () => handleSet({ hygiene: Math.min(pet.hygiene + 50, 100) }, PetAnimation.BATH) },
			],
		},
		{
			categoryName: 'Care',
			actions: [
				{ name: 'Toilet', onClick: () => handleSet({ toilet: 100 }, PetAnimation.TOILET) },
				{ name: 'Sleep', onClick: () => handleSet({ energy: 100 }, PetAnimation.SLEEP) },
			],
		},
	];

	const selectedActions = actionCategories.find((cat) => cat.categoryName === selectedCategory)?.actions || [];

	return (
		<div className="flex-1 flex flex-col gap-12 items-center">
			<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full">
				<Button style={`w-fit aspect-square`} variant="ghost" size="sm" onClick={() => setPet(undefined)}>
					<Triangle strokeWidth={2} size={25} color="var(--primary)" className="rotate-270" />
				</Button>

				<InputTextHidden
					id={`pet-name-${pet._id}`}
					inputStyles="font-bold text-3xl text-foreground justify-self-center px-2"
					placeholder={pet.name}
					value={pet.name}
					onChange={(e) => {
						handleSet({ name: e.target.value });
					}}
				/>

				<Button
					style={`aspect-square w-fit justify-self-end`}
					variant="danger"
					size="sm"
					onClick={() => handleDelete(pet._id)}
				>
					<CircleX strokeWidth={2} size={25} color="var(--danger)" />
				</Button>
			</div>

			<div className="flex-1 flex flex-col gap-5 items-center justify-center">
				<div className="relative inline-block max-w-[80vw] sm:max-w-md" style={{ minHeight: '44px' }}>
					{!currentAnimation && (
						<>
							{/* Bubble */}
							<div className="bg-white border-2 border-primary rounded-xl px-4 py-2 text-base whitespace-nowrap">
								{getMessage(pet)}
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

				<div className="relative">
					<PetSprite height={300} pet={pet} animation={currentAnimation} onAnimationEnd={() => setCurrentAnimation(undefined)} />
				</div>
			</div>

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
							disabled={!!currentAnimation}
							style={`${currentAnimation ? 'opacity-30 pointer-events-none' : ''}`}
						>
							{action.name}
						</Button>
					))}
				</div>
			</div>
		</div>
	);
};

export default PetPage;
