import spriteData from '@/data/pets.json';
import { Pet, PetAnimation } from '@widgetable/types';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

interface PetSpriteProps {
	pet: Pet;
	height?: number;
	width?: number;
	animation?: PetAnimation;
	onAnimationEnd?: () => void;
}

const getPetIdleSprite = (pet: Pet): string => {
	// Show egg sprite if pet is still an egg
	if (pet.isEgg) return spriteData.egg as string;

	const petSprites = spriteData[pet.type as keyof typeof spriteData];
	if (typeof petSprites === 'string') return petSprites;

	if (!pet.needs) return petSprites.idle.happy;

	if (pet.needs.hygiene < 30) return petSprites.idle.dirty;
	if (pet.needs.toilet < 30) return petSprites.idle.sad;
	if (pet.needs.hunger < 30 || pet.needs.thirst < 30) return petSprites.idle.sad;
	if (pet.needs.energy < 30) return petSprites.idle.sleepy;

	return petSprites.idle.happy;
};

const PetSprite = ({ pet, height = 500, width = 200, animation, onAnimationEnd }: PetSpriteProps) => {
	const idleSprite = useMemo(() => getPetIdleSprite(pet), [pet.isEgg, pet.type, pet.needs]);
	const [currentSprite, setCurrentSprite] = useState<string>(idleSprite);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		// Don't animate eggs
		if (pet.isEgg || !animation) {
			setCurrentSprite(idleSprite);
			return;
		}

		const petSprites = spriteData[pet.type as keyof typeof spriteData];
		if (typeof petSprites === 'string') return;

		const animationData = petSprites.animations[animation];

		if (animationData) {
			setIsAnimating(true);
			setCurrentSprite(animationData.sprite);

			const timer = setTimeout(() => {
				setIsAnimating(false);
				setCurrentSprite(idleSprite);
				onAnimationEnd?.();
			}, animationData.duration);

			return () => clearTimeout(timer);
		}
	}, [animation, idleSprite, pet.isEgg, pet.type, onAnimationEnd]);

	useEffect(() => {
		if (!isAnimating) {
			setCurrentSprite(idleSprite);
		}
	}, [idleSprite, isAnimating]);

	return (
		<Image
			src={currentSprite}
			alt={pet.name}
			height={height}
			width={width}
			style={{ width: 'auto', height: `${height}px` }}
		/>
	);
};

export default PetSprite;
