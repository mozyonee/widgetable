import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Pet } from '@widgetable/types';

interface PetsState {
	pets: Pet[];
	selectedPet: Pet | null;
	loaded: boolean;
}

const initialState: PetsState = {
	pets: [],
	selectedPet: null,
	loaded: false,
};

export const petsSlice = createSlice({
	name: 'pets',
	initialState,
	reducers: {
		setPets: (state, action: PayloadAction<Pet[]>) => {
			state.pets = action.payload;
			state.loaded = true;
		},
		addPet: (state, action: PayloadAction<Pet>) => {
			state.pets.push(action.payload);
		},
		setSelectedPet: (state, action: PayloadAction<Pet | null>) => {
			state.selectedPet = action.payload;
		},
		clearPets: () => initialState,
	},
});

export const { setPets, addPet, setSelectedPet, clearPets } = petsSlice.actions;
export default petsSlice.reducer;
