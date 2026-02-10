import { Skeleton } from '@/components/ui/Skeleton';
import PetSprite from '@/features/pets/components/PetSprite';
import { PetContext } from '@/features/pets/context/PetContext';
import { callError } from '@/lib/functions';
import { useAppSelector } from '@/store';
import { EGG_ITEM_NAME, HATCH_DURATION } from '@widgetable/types';
import { Egg, Plus, Users } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { usePets } from '../hooks/usePets';
import { getParentNames } from '../utils/functions';

const PetsPage = () => {
	const user = useAppSelector((state) => state.user.userData);
	const { setPet } = useContext(PetContext);
	const { pets, loading, addPet } = usePets();

	const eggCount = user?.inventory?.[EGG_ITEM_NAME] ?? 0;
	const canAddPet = eggCount > 0;

	const handleAddPet = () => {
		if (!canAddPet) {
			callError('You need eggs to add a pet!');
			return;
		}
		addPet();
	};

	return (
		<div className="flex flex-col gap-6 h-full">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-3xl text-foreground flex-1 text-center">Pets</h1>
				<div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-secondary/20">
					<Egg className="stroke-primary" size={20} />
					<span className="font-bold text-foreground">{eggCount}</span>
				</div>
			</div>

			{loading ? (
				<div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))]">
					<PetCardSkeleton />
					<PetCardSkeleton />
					<PetCardSkeleton />
				</div>
			) : pets.length > 0 ? (
				<div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))]">
					{pets.map((pet) => {
						const parentNames = getParentNames(pet, user?.name);

						return (
							<div
								key={pet._id}
								className="bg-white rounded-2xl p-4 flex flex-col items-center justify-between gap-2 cursor-pointer relative shadow-md border border-secondary/20 hover:scale-105 transition-transform duration-300"
								onClick={() => setPet(pet)}
							>
								<PetSprite pet={pet} height={100} />
								<p className="text-2xl font-bold text-foreground text-center">{pet.isEgg ? 'Egg' : pet.name}</p>
								{pet.isEgg ? (
									<EggTimer hatchTime={pet.hatchTime} />
								) : (
									<>
										<div className="text-sm text-secondary font-semibold">Level {pet.level}</div>
										{parentNames.length > 0 && (
											<div className="flex items-center justify-center gap-1 text-secondary text-xs">
												<Users size={12} />
												{parentNames.join(', ')}
											</div>
										)}
									</>
								)}
							</div>
						);
					})}

					<AddPetButton onClick={handleAddPet} />
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center">
					<p className="text-secondary text-center text-lg mb-4">
						{canAddPet ? 'Click the button below to add a pet!' : 'You need eggs to add a pet!'}
					</p>
					<AddPetButton onClick={handleAddPet} variant="centered" />
				</div>
			)}
		</div>
	);
};

const EggTimer = ({ hatchTime }: { hatchTime?: Date }) => {
	const [timeLeft, setTimeLeft] = useState<string>('');
	const [progress, setProgress] = useState<number>(0);
	const [isHatching, setIsHatching] = useState<boolean>(false);

	useEffect(() => {
		if (!hatchTime) return;

		const hatchTimeMs = new Date(hatchTime).getTime();
		const creationTime = hatchTimeMs - HATCH_DURATION;

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
			const now = Date.now();
			const diff = hatchTimeMs - now;

			if (diff <= 0) {
				setIsHatching(true);
				return;
			}

			setTimeLeft(formatTime(diff));

			// Calculate progress (how much time has passed)
			const elapsed = now - creationTime;
			const progressPercent = Math.min(100, Math.max(0, (elapsed / HATCH_DURATION) * 100));
			setProgress(progressPercent);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [hatchTime]);

	if (isHatching) {
		return (
			<div className="flex items-center justify-center gap-1 text-primary text-xs font-semibold">
				Hatching...
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center gap-2 w-full">
			<div className="flex-1 bg-secondary/20 rounded-full h-1.5 overflow-hidden">
				<div
					className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
					style={{ width: `${progress}%` }}
				/>
			</div>
			<div className="text-primary text-xs font-semibold whitespace-nowrap">{timeLeft || 'Calculating...'}</div>
		</div>
	);
};

const PetCardSkeleton = () => {
	return (
		<div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-between gap-4 shadow-md border border-secondary/20">
			<Skeleton className="h-[100px] w-[100px] rounded-full" />
			<Skeleton className="h-6 w-20" />
		</div>
	);
};

const AddPetButton = ({
	onClick,
	variant = 'grid',
	disabled = false,
}: {
	onClick: () => void;
	variant?: 'grid' | 'centered';
	disabled?: boolean;
}) => {
	if (variant === 'centered') {
		return (
			<button
				className={`bg-primary text-white font-bold rounded-lg py-3 px-6 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
					}`}
				onClick={onClick}
				disabled={disabled}
			>
				Add Pet
			</button>
		);
	}

	return (
		<button
			className={`bg-white/50 border-2 border-dashed border-secondary/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-transform duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:bg-white'
				}`}
			onClick={onClick}
			disabled={disabled}
		>
			<Plus className="stroke-primary h-8 w-8" />
			<p className="text-lg font-semibold text-primary">Add Pet</p>
		</button>
	);
};

export default PetsPage;
