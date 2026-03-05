import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ItemStatus } from '@widgetable/types';

interface ItemsState {
	itemStatus: ItemStatus | null;
	loaded: boolean;
}

const initialState: ItemsState = {
	itemStatus: null,
	loaded: false,
};

export const itemsSlice = createSlice({
	name: 'items',
	initialState,
	reducers: {
		setItemStatus: (state, action: PayloadAction<ItemStatus>) => {
			state.itemStatus = action.payload;
			state.loaded = true;
		},
		clearItems: () => initialState,
	},
});

export const { setItemStatus, clearItems } = itemsSlice.actions;
export default itemsSlice.reducer;
