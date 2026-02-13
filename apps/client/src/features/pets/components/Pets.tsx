import { Skeleton } from '@/components/ui/Skeleton';
import PetSprite, { getPetIdleSprite } from '@/features/pets/components/PetSprite';
import { setSelectedPet } from '@/features/pets/slices/petsSlice';
import { useTranslation } from '@/i18n/useTranslation';
import { callError } from '@/lib/functions';
import { useImagesLoaded } from '@/lib/useImagesLoaded';
import { useAppDispatch, useAppSelector } from '@/store';
import { Clock, Plus, Users } from '@nsmr/pixelart-react';
import {
	EGG_ITEM_NAME,
	EXPEDITION_BASE_DURATION,
	EXPEDITION_LEVEL_MULTIPLIER,
	VALENTINE_GIFT_ITEM_NAMES,
} from '@widgetable/types';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePets } from '../hooks/usePets';
import { getParentNames } from '../utils/functions';

// Hook to check if expedition is ready (updates every second)
const useExpeditionReady = (returnTime?: Date) => {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (!returnTime) {
			setIsReady(false);
			return;
		}

		const checkReady = () => {
			setIsReady(new Date(returnTime).getTime() <= Date.now());
		};

		checkReady();
		const interval = setInterval(checkReady, 1000);
		return () => clearInterval(interval);
	}, [returnTime]);

	return isReady;
};

const PetCard = ({ pet, userName }: { pet: any; userName?: string }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const dispatch = useAppDispatch();
	const parentNames = getParentNames(pet, userName);
	const isExpeditionReady = useExpeditionReady(pet.isOnExpedition ? pet.expeditionReturnTime : undefined);

	const handleClick = () => {
		dispatch(setSelectedPet(pet));
		router.push(`/pet/${pet._id}`);
	};

	return (
		<div
			key={pet._id}
			className="bg-white rounded-2xl px-4 py-2 flex flex-col items-center justify-between gap-1 cursor-pointer relative shadow-md border border-secondary/20 hover:scale-105 transition-transform duration-300"
			onClick={handleClick}
		>
			<div className="h-[100px] flex items-end justify-center overflow-hidden">
				{pet.isOnExpedition && !isExpeditionReady ? (
					<Clock width={64} height={64} className="text-primary" />
				) : (
					<PetSprite pet={pet} height={100} forceShow={isExpeditionReady} />
				)}
			</div>
			{pet.isOnExpedition && !isExpeditionReady && (
				<div className="w-full mt-2">
					<ExpeditionProgressTimer returnTime={pet.expeditionReturnTime} petLevel={pet.level} />
				</div>
			)}
			{isExpeditionReady && (
				<div className="w-full mt-2">
					<div className="text-center text-sm font-semibold text-green-600">
						{t('pets.ready')}
					</div>
				</div>
			)}
			<p className={`text-2xl font-bold text-foreground text-center w-full truncate ${isExpeditionReady ? "" : "mt-2"}`}>
				{pet.isEgg ? t('pets.egg') : pet.name}
			</p>
			{pet.isEgg ? (
				<EggTimer hatchTime={pet.hatchTime} createdAt={pet.createdAt} />
			) : (
				<>
					<div className="text-sm text-secondary font-semibold">{t('pets.level', { level: pet.level })}</div>
					{!pet.isOnExpedition && parentNames.length > 0 && (
						<div className="flex items-center justify-center gap-1 text-secondary text-xs">
							<Users width={12} height={12} />
							{parentNames.join(', ')}
						</div>
					)}
				</>
			)}
		</div>
	);
};

const PetsPage = () => {
	const { t } = useTranslation();
	const user = useAppSelector((state) => state.user.userData);
	const { pets, loading, addPet } = usePets();

	const spriteUrls = useMemo(
		() => pets.map((pet) => getPetIdleSprite(pet, true).sprite),
		[pets],
	);
	const spritesLoaded = useImagesLoaded(spriteUrls);

	const eggCount = user?.inventory?.[EGG_ITEM_NAME] ?? 0;
	const canAddPet = eggCount > 0;

	const valentineCount = useMemo(() => {
		if (!user?.inventory) return 0;
		return VALENTINE_GIFT_ITEM_NAMES.reduce((sum, name) => sum + (user.inventory![name] ?? 0), 0);
	}, [user?.inventory]);

	const handleAddPet = () => {
		if (!canAddPet) {
			callError(t('pets.needEggs'));
			return;
		}
		addPet();
	};

	return (
		<div className="flex flex-col gap-6 h-full">
			<div className="grid grid-cols-[1fr_auto_1fr] items-center flex-shrink-0">
				<div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-secondary/20 w-fit">
					<img src="/valentine/arrow_pink_heart.png" alt="Valentines" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />
					<span className="font-bold text-foreground text-xl">{valentineCount}</span>
				</div>
				<h1 className="font-bold text-3xl text-foreground text-center">{t('pets.title')}</h1>
				<div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-secondary/20 justify-self-end">
					<img src="/assets/egg_white.png" alt="Egg" className="w-5 h-5 object-contain" />
					<span className="font-bold text-foreground text-xl">{eggCount}</span>
				</div>
			</div>

			<div className="pb-4">
				{loading || !spritesLoaded ? (
					<div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(125px,1fr))]">
						<PetCardSkeleton />
						<PetCardSkeleton />
						<PetCardSkeleton />
					</div>
				) : pets.length > 0 ? (
					<div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(125px,1fr))]">
						{pets.map((pet) => (
							<PetCard key={pet._id} pet={pet} userName={user?.name} />
						))}
						<AddPetButton onClick={handleAddPet} />
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-12">
						<p className="text-secondary text-center text-lg mb-4">
							{canAddPet ? t('pets.clickToAdd') : t('pets.needEggs')}
						</p>
						<AddPetButton onClick={handleAddPet} variant="centered" />
					</div>
				)}
			</div>
		</div>
	);
};

const EggTimer = ({ hatchTime, createdAt }: { hatchTime?: Date; createdAt?: Date }) => {
	const { t } = useTranslation();
	const [timeLeft, setTimeLeft] = useState<string>('');
	const [progress, setProgress] = useState<number>(0);
	const [isHatching, setIsHatching] = useState<boolean>(false);

	useEffect(() => {
		if (!hatchTime || !createdAt) return;

		const hatchTimeMs = new Date(hatchTime).getTime();
		const creationTimeMs = new Date(createdAt).getTime();
		const totalDuration = hatchTimeMs - creationTimeMs;

		const formatTime = (milliseconds: number): string => {
			const seconds = Math.floor(milliseconds / 1000);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);

			if (hours > 0) return `${hours}h`;
			if (minutes > 0) return `${minutes}m`;
			return `${seconds}s`;
		};

		const updateTimer = () => {
			const now = Date.now();
			const diff = hatchTimeMs - now;

			if (diff <= 0) {
				setIsHatching(true);
				return;
			}

			setTimeLeft(formatTime(diff));

			const elapsed = now - creationTimeMs;
			const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
			setProgress(progressPercent);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [hatchTime, createdAt]);

	if (isHatching) {
		return (
			<div className="flex items-center justify-center gap-1 text-primary text-xs font-semibold">
				{t('pets.hatching')}
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
			<div className="text-primary text-xs font-semibold whitespace-nowrap">{timeLeft || t('common.calculating')}</div>
		</div>
	);
};

const ExpeditionProgressTimer = ({ returnTime, petLevel }: { returnTime?: Date; petLevel: number }) => {
	const { t } = useTranslation();
	const [timeLeft, setTimeLeft] = useState<string>('');
	const [progress, setProgress] = useState<number>(0);
	const [isReady, setIsReady] = useState<boolean>(false);

	useEffect(() => {
		if (!returnTime) return;

		const returnTimeMs = new Date(returnTime).getTime();
		// Calculate expedition duration based on level
		const baseDuration = EXPEDITION_BASE_DURATION;
		const levelMultiplier = 1 + petLevel * EXPEDITION_LEVEL_MULTIPLIER;
		const totalDuration = baseDuration * levelMultiplier;
		const startTime = returnTimeMs - totalDuration;

		const formatTime = (milliseconds: number): string => {
			const seconds = Math.floor(milliseconds / 1000);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;

			if (hours > 0) {
				return `${hours}h ${remainingMinutes}m`;
			}
			return `${minutes}m`;
		};

		const updateTimer = () => {
			const now = Date.now();
			const diff = returnTimeMs - now;

			if (diff <= 0) {
				setIsReady(true);
				setTimeLeft(t('pets.ready'));
				setProgress(100);
				return;
			}

			setTimeLeft(formatTime(diff));

			// Calculate progress (how much time has passed)
			const elapsed = now - startTime;
			const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
			setProgress(progressPercent);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [returnTime, petLevel]);

	return (
		<div className="flex items-center justify-center gap-2 w-full">
			<div className="flex-1 bg-secondary/20 rounded-full h-1.5 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-1000 ease-linear ${isReady ? 'bg-green-600' : 'bg-primary'
						}`}
					style={{ width: `${progress}%` }}
				/>
			</div>
			<div className={`text-xs font-semibold whitespace-nowrap ${isReady ? 'text-green-600' : 'text-primary'}`}>
				{timeLeft || t('common.calculating')}
			</div>
		</div>
	);
};

const PetCardSkeleton = () => {
	return (
		<div className="bg-white rounded-2xl p-2 flex flex-col items-center justify-between gap-4 shadow-md border border-secondary/20">
			<Skeleton className="aspect-square w-full rounded-full" />
			<Skeleton className="h-6 w-full" />
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
	const { t } = useTranslation();
	if (variant === 'centered') {
		return (
			<button
				className={`bg-primary text-white font-bold rounded-lg py-3 px-6 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
					}`}
				onClick={onClick}
				disabled={disabled}
			>
				{t('pets.addPet')}
			</button>
		);
	}

	return (
		<button
			className={`bg-white/50 border-2 border-dashed border-secondary/50 rounded-2xl p-2 flex flex-col items-center justify-center gap-2 transition-transform duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:bg-white'
				}`}
			onClick={onClick}
			disabled={disabled}
		>
			<Plus width={32} height={32} className="text-primary" />
			<p className="text-lg font-semibold text-primary">{t('pets.addPet')}</p>
		</button>
	);
};

export default PetsPage;
