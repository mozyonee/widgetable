import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from '@/store/storage';

import claimsReducer from '@/features/claims/slices/claimsSlice';
import petsReducer from '@/features/pets/slices/petsSlice';
import userReducer from '@/store/slices/userSlice';

const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['user', 'pets', 'claims', 'adminUsers', 'adminStats'],
};

const rootReducer = combineReducers({
	user: userReducer,
	pets: petsReducer,
	claims: claimsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
