import spriteData from '@/data/pets.json';
import { ANIMATION_DURATIONS, Pet, PetAnimation } from '@widgetable/types';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import AnimatedSprite from './AnimatedSprite';

interface PetSpriteProps {
	pet: Pet;
	height?: number | string;
	width?: number | string;
	animation?: PetAnimation;
	onAnimationEnd?: () => void;
}

type SpriteConfig = {
	sprite: string;
	fps?: number;
};

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
const selectSpriteConfig = (
	spriteData: SpriteConfig | SpriteConfig[] | string,
	seed?: number
): SpriteConfig => {
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

const getPetIdleSprite = (pet: Pet): SpriteConfig => {
	// Show egg sprite if pet is still an egg
	if (pet.isEgg) return { sprite: spriteData.egg as string };

	const petSprites = spriteData[pet.type as keyof typeof spriteData];
	if (typeof petSprites === 'string') return { sprite: petSprites };

	// Determine which idle state to show based on needs
	let idleState: 'happy' | 'sad' | 'dirty' | 'sleepy' = 'happy';

	if (pet.needs) {
		if (pet.needs.hygiene < 30) idleState = 'dirty';
		else if (pet.needs.toilet < 30) idleState = 'sad';
		else if (pet.needs.hunger < 30 || pet.needs.thirst < 30) idleState = 'sad';
		else if (pet.needs.energy < 30) idleState = 'sleepy';
	}

	const idleSprite = (petSprites as any)[idleState];

	// Use pet ID as seed for stable selection (won't change on every render)
	const seed = pet._id ? hashPetId(pet._id) : 0;
	return selectSpriteConfig(idleSprite, seed);
};

const PetSprite = ({ pet, height = 500, width = 200, animation, onAnimationEnd }: PetSpriteProps) => {
	const idleSpriteConfig = useMemo(() => getPetIdleSprite(pet), [pet.isEgg, pet.type, pet.needs]);
	const [currentSpriteConfig, setCurrentSpriteConfig] = useState<SpriteConfig>(idleSpriteConfig);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		// Don't animate eggs
		if (pet.isEgg || !animation) {
			setCurrentSpriteConfig(idleSpriteConfig);
			return;
		}

		const petSprites = spriteData[pet.type as keyof typeof spriteData];
		if (typeof petSprites === 'string') return;

		const animationData = (petSprites as any)[animation];

		if (animationData) {
			// Randomly select from array each time animation triggers (no seed for variety)
			const selectedSprite = selectSpriteConfig(animationData);

			setIsAnimating(true);
			setCurrentSpriteConfig(selectedSprite);

			// Set timeout for animation duration from ANIMATION_DURATIONS config
			const duration = ANIMATION_DURATIONS[animation];
			const timer = setTimeout(() => {
				setIsAnimating(false);
				setCurrentSpriteConfig(idleSpriteConfig);
				onAnimationEnd?.();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [animation, idleSpriteConfig, pet.isEgg, pet.type, onAnimationEnd]);

	useEffect(() => {
		if (!isAnimating) {
			setCurrentSpriteConfig(idleSpriteConfig);
		}
	}, [idleSpriteConfig, isAnimating]);

	// If sprite has fps, it's an animated sprite
	if (currentSpriteConfig.fps) {
		return (
			<AnimatedSprite
				sprite={currentSpriteConfig.sprite}
				fps={currentSpriteConfig.fps}
				loop={true}
				height={height}
				alt={pet.name}
			/>
		);
	}

	// Fallback to static image for old-style sprites
	const heightNum = typeof height === 'number' ? height : 500;
	const widthNum = typeof width === 'number' ? width : 200;
	const heightStyle = typeof height === 'number' ? `${height}px` : height;

	return (
		<Image
			src={currentSpriteConfig.sprite}
			alt={pet.name}
			height={heightNum}
			width={widthNum}
			style={{ width: 'auto', height: heightStyle }}
		/>
	);
};

export default PetSprite;
