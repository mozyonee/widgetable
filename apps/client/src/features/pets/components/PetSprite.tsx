import spriteData from '@/data/pets.json';
import { IPet } from '@/features/pets/types/pet.types';
import Image from 'next/image';

interface PetSpriteProps {
	pet: IPet;
	height?: number;
	width?: number;
}
export default function PetSprite({ pet, height = 500, width = 200 }: PetSpriteProps) {
	const getPetSprite = () => {
		const petSprites = spriteData[pet.type as keyof typeof spriteData];

		if (pet.hygiene < 30) return petSprites.idle.dirty;
		if (pet.toilet < 30) return petSprites.idle.sad;
		if (pet.hunger < 30 || pet.thirst < 30) return petSprites.idle.sad;
		if (pet.energy < 30) return petSprites.idle.sleepy;

		return petSprites.idle.happy;
	};

	return (
		<div>
			<Image src={getPetSprite()} alt={pet.name} height={height} width={width} />
		</div>
	);
}
