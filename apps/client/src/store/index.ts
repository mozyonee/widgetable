import { setApiStore } from '@/lib/api';
import storage from '@/store/storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';

import userReducer from '@/features/auth/slices/userSlice';
import petsReducer from '@/features/pets/slices/petsSlice';
import itemsReducer from '@/features/items/slices/itemsSlice';

const persistConfig = {
	key: 'root',
	storage,
	whitelist: ['user', 'pets', 'items', 'adminUsers', 'adminStats'],
};

const rootReducer = combineReducers({
	user: userReducer,
	pets: petsReducer,
	items: itemsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
			},
		}),
});

setApiStore(store);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
