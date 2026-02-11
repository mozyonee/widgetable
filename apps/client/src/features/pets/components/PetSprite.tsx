import spriteData from '@/data/pets.json';
import { getPetScale } from '@/data/petScales';
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
	forceShow?: boolean; // Show sprite even if on expedition
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

const getPetIdleSprite = (pet: Pet, forceShow?: boolean): SpriteConfig => {
	// Hide sprite if pet is on expedition (unless forced to show)
	if (pet.isOnExpedition && !forceShow) return { sprite: '' };

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

const PetSprite = ({ pet, height = 500, width = 200, animation, onAnimationEnd, forceShow }: PetSpriteProps) => {
	const idleSpriteConfig = useMemo(() => getPetIdleSprite(pet, forceShow), [pet.isEgg, pet.isOnExpedition, pet.type, pet.needs, forceShow]);
	const [currentSpriteConfig, setCurrentSpriteConfig] = useState<SpriteConfig>(idleSpriteConfig);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		// Don't animate eggs or pets on expedition
		if (pet.isEgg || pet.isOnExpedition || !animation) {
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
	}, [animation, idleSpriteConfig, pet.isEgg, pet.isOnExpedition, pet.type, onAnimationEnd]);

	useEffect(() => {
		if (!isAnimating) {
			setCurrentSpriteConfig(idleSpriteConfig);
		}
	}, [idleSpriteConfig, isAnimating]);

	// Don't render anything if sprite is empty (pet on expedition)
	if (!currentSpriteConfig.sprite) {
		return null;
	}

	// Get scale for this pet type
	const petType = pet.isEgg ? 'egg' : pet.type;
	const scale = getPetScale(petType as any);

	// If sprite has fps, it's an animated sprite
	if (currentSpriteConfig.fps) {
		return (
			<div style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}>
				<AnimatedSprite
					sprite={currentSpriteConfig.sprite}
					fps={currentSpriteConfig.fps}
					loop={true}
					height={height}
					alt={pet.name}
				/>
			</div>
		);
	}

	// Fallback to static image for old-style sprites
	const heightNum = typeof height === 'number' ? height : 500;
	const widthNum = typeof width === 'number' ? width : 200;
	const heightStyle = typeof height === 'number' ? `${height}px` : height;

	return (
		<div style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}>
			<Image
				src={currentSpriteConfig.sprite}
				alt={pet.name}
				height={heightNum}
				width={widthNum}
				style={{ width: 'auto', height: heightStyle }}
			/>
		</div>
	);
};

export default PetSprite;
