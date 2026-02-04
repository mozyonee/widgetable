import { IPetDocument } from '@/features/pets/types/pet.types';
import { Dispatch, SetStateAction, createContext } from 'react';

interface PetContextProps {
	pet: IPetDocument | undefined;
	setPet: Dispatch<SetStateAction<IPetDocument | undefined>>;
}

export const PetContext = createContext<PetContextProps>({
	pet: undefined,
	setPet: () => {},
});
