import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const formatDate = (date: Date | number | string | undefined): string => {
	if (!date) return 'N/A';
	return new Date(date).toLocaleDateString('uk');
};

export const formatTime = (seconds: number): string => {
	if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
		return '0:00';
	}
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${Math.round(secs).toString().padStart(2, '0')}`;
};

export const formatDateTime = (date: Date | string | undefined): string => {
	if (!date) return 'N/A';
	return new Date(date).toLocaleString('uk');
};

export const callSuccess = (text: string) => {
	toast.success(
		(t) => (
			<div onClick={() => toast.dismiss(t.id)}>
				<p>{text}</p>
			</div>
		),
		{
			duration: 3000,
			style: {
				zIndex: 10000,
				border: '1px solid var(--primary)',
				backgroundColor: 'var(--background)',
				padding: '16px',
				color: 'var(--foreground)',
			},
		},
	);
};

export const callError = (text: string) => {
	toast.error(
		(t) => (
			<div
				onClick={() => {
					toast.dismiss(t.id);
				}}
			>
				<p>{text}</p>
			</div>
		),
		{
			duration: 3000,
			style: {
				zIndex: 10000,
				border: '1px solid var(--danger)',
				backgroundColor: 'var(--background)',
				padding: '16px',
				color: 'var(--foreground)',
			},
		},
	);
};

export const isValidUrl = (url: string) => {
	try {
		new URL(url);
		return true;
	} catch (_) {
		return false;
	}
};

export const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';

	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1000));

	return Math.round((bytes / Math.pow(1000, i)) * 10) / 10 + ' ' + sizes[i];
};

export const capitalize = (text: string) => {
	if (text?.length > 1) return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
	else return text;
};

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}
