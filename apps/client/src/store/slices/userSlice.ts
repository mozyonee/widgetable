import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@widgetable/types';

interface UserState {
	isAuthenticated: boolean;
	recoveryCodes: string[] | null;
	userData: User | null;
}

const initialState: UserState = {
	isAuthenticated: false,
	recoveryCodes: null,
	userData: null,
};

export const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setAuthenticated: (state, action: PayloadAction<boolean>) => {
			state.isAuthenticated = action.payload;
		},
		setRecoveryCodes: (state, action: PayloadAction<string[] | null>) => {
			state.recoveryCodes = action.payload;
		},
		setUserData: (state, action: PayloadAction<User | null>) => {
			state.userData = action.payload;
		},
		logout: (state) => {
			state.isAuthenticated = false;
			state.recoveryCodes = null;
			state.userData = null;
		},
	},
});

export const { setAuthenticated, setRecoveryCodes, setUserData, logout } = userSlice.actions;

export default userSlice.reducer;
