import { Pet } from '@widgetable/types';
import { Dispatch, SetStateAction, createContext } from 'react';

interface PetContextProps {
	pet: Pet | undefined;
	setPet: Dispatch<SetStateAction<Pet | undefined>>;
}

export const PetContext = createContext<PetContextProps>({
	pet: undefined,
	setPet: () => {},
});
