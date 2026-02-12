import axios from 'axios';

const api = axios.create({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});

const pendingRequests = new Set<AbortController>();

const getToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	try {
		const persisted = localStorage.getItem('persist:root');
		if (!persisted) return null;
		const root = JSON.parse(persisted);
		const user = JSON.parse(root.user);
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
	(error) => {
		if (error.config?.signal) {
			pendingRequests.forEach((controller) => {
				if (controller.signal === error.config.signal) pendingRequests.delete(controller);
			});
		}
		return Promise.reject(error);
	},
);

export const abortPendingRequests = () => {
	pendingRequests.forEach((controller) => controller.abort());
	pendingRequests.clear();
};

export const isAbortError = (error: any): boolean => {
	return axios.isCancel(error) || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED';
};

export default api;
