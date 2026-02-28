import axios from 'axios';
import type { RootState } from '@/store';

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});

const pendingRequests = new Set<AbortController>();

let storeRef: { getState: () => RootState } | null = null;

export const setApiStore = (store: { getState: () => RootState }) => {
	storeRef = store;
};

const getToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	if (storeRef) {
		return storeRef.getState().user.token || null;
	}
	try {
		const persisted = localStorage.getItem('persist:root');
		if (!persisted) return null;
		const root = JSON.parse(persisted) as { user: string };
		const user = JSON.parse(root.user) as { token?: string };
		return user.token || null;
	} catch {
		return null;
	}
};

api.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	const controller = new AbortController();
	config.signal = config.signal || controller.signal;
	pendingRequests.add(controller);
	return config;
});

api.interceptors.response.use(
	(response) => {
		const signal = response.config.signal;
		pendingRequests.forEach((controller) => {
			if (controller.signal === signal) pendingRequests.delete(controller);
		});
		return response;
	},
	(error: unknown) => {
		if (axios.isAxiosError(error) && error.config?.signal) {
			pendingRequests.forEach((controller) => {
				if (controller.signal === error.config!.signal) pendingRequests.delete(controller);
			});
		}
		return Promise.reject(error instanceof Error ? error : new Error(String(error)));
	},
);

export const abortPendingRequests = () => {
	pendingRequests.forEach((controller) => controller.abort());
	pendingRequests.clear();
};

export const isAbortError = (error: unknown): boolean => {
	if (axios.isCancel(error)) return true;
	const e = error as { name?: string; code?: string } | null;
	return e?.name === 'AbortError' || e?.code === 'ERR_CANCELED';
};

export default api;
