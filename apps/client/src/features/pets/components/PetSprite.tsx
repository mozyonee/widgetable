import { PET_SPRITE_SIZES } from '@/config/constants';
import { getPetScale } from '@/data/petScales';
import {
	ANIMATION_DURATIONS,
	Pet,
	PET_SPRITE_DATA,
	PET_THRESHOLDS,
	PetAnimation,
	SpriteConfig,
} from '@widgetable/types';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import AnimatedSprite from './AnimatedSprite';

interface PetSpriteProps {
	pet: Pet;
	height?: number | string;
	width?: number | string;
	animation?: PetAnimation;
	onAnimationEnd?: () => void;
	onLoad?: () => void;
	forceShow?: boolean; // Show sprite even if on expedition
}

// Simple hash function for stable randomization based on pet ID
const hashPetId = (id: string): number => {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		const char = id.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
};

// Select a random sprite config from an array or return the single config
const selectSpriteConfig = (spriteData: SpriteConfig | SpriteConfig[] | string, seed?: number): SpriteConfig => {
	// Handle string format (old static sprites)
	if (typeof spriteData === 'string') {
		return { sprite: spriteData };
	}

	// Handle array format (multiple options)
	if (Array.isArray(spriteData)) {
		const index = seed !== undefined ? seed % spriteData.length : Math.floor(Math.random() * spriteData.length);
		return spriteData[index];
	}

	// Handle single object format
	return spriteData;
};

export const getPetIdleSprite = (pet: Pet, forceShow?: boolean): SpriteConfig => {
	// Hide sprite if pet is on expedition (unless forced to show)
	if (pet.isOnExpedition && !forceShow) return { sprite: '' };

	// Show egg sprite if pet is still an egg
	if (pet.isEgg) return { sprite: PET_SPRITE_DATA.egg as string };

	const petSprites = PET_SPRITE_DATA[pet.type];
	if (typeof petSprites === 'string') return { sprite: petSprites };

	// Determine which idle state to show based on needs
	let idleState: 'happy' | 'sad' | 'dirty' | 'sleepy' = 'happy';

	if (pet.needs) {
		if (pet.needs.hygiene < PET_THRESHOLDS.URGENT) idleState = 'dirty';
		else if (pet.needs.toilet < PET_THRESHOLDS.URGENT) idleState = 'sad';
		else if (pet.needs.hunger < PET_THRESHOLDS.URGENT || pet.needs.thirst < PET_THRESHOLDS.URGENT)
			idleState = 'sad';
		else if (pet.needs.energy < PET_THRESHOLDS.URGENT) idleState = 'sleepy';
	}

	const idleSprite = petSprites[idleState];
	if (!idleSprite) return { sprite: '' };

	// Use pet ID as seed for stable selection (won't change on every render)
	const seed = pet._id ? hashPetId(pet._id) : 0;
	return selectSpriteConfig(idleSprite, seed);
};

const PetSprite = ({
	pet,
	height = PET_SPRITE_SIZES.DEFAULT_HEIGHT,
	width = PET_SPRITE_SIZES.DEFAULT_WIDTH,
	animation,
	onAnimationEnd,
	onLoad,
	forceShow,
}: PetSpriteProps) => {
	const idleSpriteConfig = useMemo(
		() => getPetIdleSprite(pet, forceShow),
		[pet.isEgg, pet.isOnExpedition, pet.type, pet.needs, forceShow],
	);
	const [currentSpriteConfig, setCurrentSpriteConfig] = useState<SpriteConfig>(idleSpriteConfig);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (pet.isEgg || pet.isOnExpedition || !animation) {
			setCurrentSpriteConfig(idleSpriteConfig);
			return;
		}

		const petSprites = PET_SPRITE_DATA[pet.type];
		if (typeof petSprites === 'string') return;

		const animationData = petSprites[animation];

		if (animationData) {
			// Randomly select from array each time animation triggers (no seed for variety)
			const selectedSprite = selectSpriteConfig(animationData);

			setIsAnimating(true);
			setCurrentSpriteConfig(selectedSprite);

			const duration = ANIMATION_DURATIONS[animation];
			const timer = setTimeout(() => {
				setIsAnimating(false);
				setCurrentSpriteConfig(idleSpriteConfig);
				onAnimationEnd?.();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [animation, idleSpriteConfig, pet.isEgg, pet.isOnExpedition, pet.type, onAnimationEnd]);

	useEffect(() => {
		if (!isAnimating) {
			setCurrentSpriteConfig(idleSpriteConfig);
		}
	}, [idleSpriteConfig, isAnimating]);

	if (!currentSpriteConfig.sprite) {
		return null;
	}

	const petType = pet.isEgg ? 'egg' : pet.type;
	const scale = getPetScale(petType);

	if (currentSpriteConfig.fps) {
		return (
			<div
				className="w-full h-full flex items-center justify-center"
				style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}
			>
				<AnimatedSprite
					sprite={currentSpriteConfig.sprite}
					fps={currentSpriteConfig.fps}
					loop={true}
					height={height}
					alt={pet.name}
					onLoad={onLoad}
				/>
			</div>
		);
	}

	const heightNum = typeof height === 'number' ? height : PET_SPRITE_SIZES.DEFAULT_HEIGHT;
	const widthNum = typeof width === 'number' ? width : PET_SPRITE_SIZES.DEFAULT_WIDTH;
	const heightStyle = typeof height === 'number' ? `${height}px` : height;

	return (
		<div
			className="w-full h-full flex items-center justify-center"
			style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}
		>
			<Image
				src={currentSpriteConfig.sprite}
				alt={pet.name}
				height={heightNum}
				width={widthNum}
				style={{ width: 'auto', height: heightStyle }}
				onLoad={onLoad}
			/>
		</div>
	);
};

export default PetSprite;
