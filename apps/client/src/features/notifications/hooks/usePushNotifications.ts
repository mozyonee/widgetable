'use client';

import api from '@/lib/api';
import { useAppSelector } from '@/store';
import { useCallback, useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

function getSwRegistration(timeoutMs = 3000): Promise<ServiceWorkerRegistration | null> {
	if (!('serviceWorker' in navigator)) return Promise.resolve(null);

	return Promise.race([
		navigator.serviceWorker.ready,
		new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
	]);
}

export const usePushNotifications = () => {
	const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
	const [permission, setPermission] = useState<NotificationPermission>('default');
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [loading, setLoading] = useState(false);

	const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'PushManager' in window;

	useEffect(() => {
		if (isSupported) {
			setPermission(Notification.permission);
		}
	}, []);

	useEffect(() => {
		if (!isAuthenticated || !isSupported) return;

		getSwRegistration().then((registration) => {
			if (!registration) return;
			registration.pushManager.getSubscription().then((sub) => {
				setIsSubscribed(!!sub);
			});
		});
	}, [isAuthenticated]);

	const subscribe = useCallback(async () => {
		if (!isSupported) return;

		setLoading(true);
		try {
			const result = await Notification.requestPermission();
			setPermission(result);
			if (result !== 'granted') return;

			const registration = await getSwRegistration();
			if (!registration) return;

			const { data } = await api.get('/notifications/vapid-public-key');
			const vapidKey = urlBase64ToUint8Array(data.key);

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: vapidKey.buffer as ArrayBuffer,
			});

			const json = subscription.toJSON();
			await api.post('/notifications/subscribe', {
				endpoint: json.endpoint,
				keys: json.keys,
			});

			setIsSubscribed(true);
		} finally {
			setLoading(false);
		}
	}, []);

	const unsubscribe = useCallback(async () => {
		setLoading(true);
		try {
			const registration = await getSwRegistration();
			if (!registration) return;

			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				const endpoint = subscription.endpoint;
				await subscription.unsubscribe();
				await api.delete('/notifications/subscribe', { data: { endpoint } });
			}

			setIsSubscribed(false);
		} finally {
			setLoading(false);
		}
	}, []);

	return { permission, isSubscribed, isSupported, loading, subscribe, unsubscribe };
};
