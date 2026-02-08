import spriteData from '@/data/pets.json';
import { Pet, PetAnimation } from '@widgetable/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface PetSpriteProps {
	pet: Pet;
	height?: number;
	width?: number;
	animation?: PetAnimation;
	onAnimationEnd?: () => void;
}

const PetSprite = ({ pet, height = 500, width = 200, animation, onAnimationEnd }: PetSpriteProps) => {
	const getPetSprite = () => {
		const petSprites = spriteData[pet.type as keyof typeof spriteData];

		// Fallback to happy sprite if needs are not available
		if (!pet.needs) return petSprites.idle.happy;

		if (pet.needs.hygiene < 30) return petSprites.idle.dirty;
		if (pet.needs.toilet < 30) return petSprites.idle.sad;
		if (pet.needs.hunger < 30 || pet.needs.thirst < 30) return petSprites.idle.sad;
		if (pet.needs.energy < 30) return petSprites.idle.sleepy;

		return petSprites.idle.happy;
	};

	const [currentSprite, setCurrentSprite] = useState<string>(getPetSprite());
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (animation) {
			const petSprites = spriteData[pet.type as keyof typeof spriteData];
			const animationData = petSprites.animations[animation];

			if (animationData) {
				setIsAnimating(true);
				setCurrentSprite(animationData.sprite);

				const timer = setTimeout(() => {
					setIsAnimating(false);
					setCurrentSprite(getPetSprite());
					onAnimationEnd?.();
				}, animationData.duration);

				return () => clearTimeout(timer);
			}
		} else {
			setCurrentSprite(getPetSprite());
		}
	}, [animation, pet]);

	useEffect(() => {
		if (!isAnimating) {
			setCurrentSprite(getPetSprite());
		}
	}, [pet.needs?.hygiene, pet.needs?.toilet, pet.needs?.hunger, pet.needs?.thirst, pet.needs?.energy, isAnimating]);

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
