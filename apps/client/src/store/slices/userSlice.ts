import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Request, User } from '@widgetable/types';

interface UserState {
	isAuthenticated: boolean;
	userData: User | null;
	token: string | null;
	friends: User[];
	friendRequests: {
		sent: Request[];
		received: Request[];
	};
	coparentingRequests: {
		sent: Request[];
		received: Request[];
	};
}

const initialState: UserState = {
	isAuthenticated: false,
	userData: null,
	token: null,
	friends: [],
	friendRequests: {
		sent: [],
		received: [],
	},
	coparentingRequests: {
		sent: [],
		received: [],
	},
};

export const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setAuthenticated: (state, action: PayloadAction<boolean>) => {
			state.isAuthenticated = action.payload;
		},
		setUserData: (state, action: PayloadAction<User | null>) => {
			state.userData = action.payload;
		},
		setToken: (state, action: PayloadAction<string | null>) => {
			state.token = action.payload;
		},
		logout: (state) => {
			state.isAuthenticated = false;
			state.userData = null;
			state.token = null;
			state.friends = [];
			state.friendRequests = { sent: [], received: [] };
			state.coparentingRequests = { sent: [], received: [] };
		},
		setFriends: (state, action: PayloadAction<User[]>) => {
			state.friends = action.payload;
		},
		setFriendRequests: (state, action: PayloadAction<{ sent: Request[]; received: Request[] }>) => {
			state.friendRequests = action.payload;
		},
		addFriend: (state, action: PayloadAction<User>) => {
			state.friends.push(action.payload);
		},
		removeFriend: (state, action: PayloadAction<string>) => {
			state.friends = state.friends.filter((friend) => friend._id !== action.payload);
		},
		addFriendRequestSent: (state, action: PayloadAction<Request>) => {
			state.friendRequests.sent.push(action.payload);
		},
		removeFriendRequestSent: (state, action: PayloadAction<string>) => {
			state.friendRequests.sent = state.friendRequests.sent.filter((req) => req._id !== action.payload);
		},
		removeFriendRequestReceived: (state, action: PayloadAction<string>) => {
			state.friendRequests.received = state.friendRequests.received.filter((req) => req._id !== action.payload);
		},
		setCoparentingRequests: (state, action: PayloadAction<{ sent: Request[]; received: Request[] }>) => {
			state.coparentingRequests = action.payload;
		},
		addCoparentingRequestSent: (state, action: PayloadAction<Request>) => {
			state.coparentingRequests.sent.push(action.payload);
		},
		removeCoparentingRequestSent: (state, action: PayloadAction<string>) => {
			state.coparentingRequests.sent = state.coparentingRequests.sent.filter((req) => req._id !== action.payload);
		},
		removeCoparentingRequestReceived: (state, action: PayloadAction<string>) => {
			state.coparentingRequests.received = state.coparentingRequests.received.filter(
				(req) => req._id !== action.payload,
			);
		},
	},
});

export const {
	setAuthenticated,
	setUserData,
	setToken,
	logout,
	setFriends,
	setFriendRequests,
	addFriend,
	removeFriend,
	addFriendRequestSent,
	removeFriendRequestSent,
	removeFriendRequestReceived,
	setCoparentingRequests,
	addCoparentingRequestSent,
	removeCoparentingRequestSent,
	removeCoparentingRequestReceived,
} = userSlice.actions;

export default userSlice.reducer;
