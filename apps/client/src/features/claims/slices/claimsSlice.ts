import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClaimStatus } from '@widgetable/types';

interface ClaimsState {
	claimStatus: ClaimStatus | null;
	loaded: boolean;
}

const initialState: ClaimsState = {
	claimStatus: null,
	loaded: false,
};

export const claimsSlice = createSlice({
	name: 'claims',
	initialState,
	reducers: {
		setClaimStatus: (state, action: PayloadAction<ClaimStatus>) => {
			state.claimStatus = action.payload;
			state.loaded = true;
		},
		clearClaims: () => initialState,
	},
});

export const { setClaimStatus, clearClaims } = claimsSlice.actions;
export default claimsSlice.reducer;
