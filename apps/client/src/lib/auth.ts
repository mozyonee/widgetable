import { useRouter } from 'next/navigation';
import api from './api';

export interface User {
	id: string;
	email: string;
}

export const getCurrentUser = async (): Promise<User | null> => {
	try {
		const response = await api.get('/auth/me').catch((error) => console.log(error));
		return response?.data;
	} catch (error) {
		return null;
	}
};

export const isAuthenticated = async (): Promise<boolean> => {
	const user = await getCurrentUser();
	return !!user;
};

export const logout = async () => {
	try {
		await api.post('/auth/logout');
		return true;
	} catch (error) {
		return false;
	}
};

export const useAuth = () => {
	const router = useRouter();

	const handleLogout = async () => {
		const success = await logout();
		if (success) {
			router.push('/auth');
		}
		return success;
	};

	return {
		getCurrentUser,
		isAuthenticated,
		logout: handleLogout,
	};
};
