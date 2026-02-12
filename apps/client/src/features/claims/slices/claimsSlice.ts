import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ClaimStatus {
	dailyAvailable: boolean;
	quickAvailable: boolean;
	nextDailyTime?: Date;
	nextQuickTime?: Date;
	petCount: number;
}

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
