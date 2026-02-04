import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const formatDate = (date: Date | number | string | undefined): string => {
	if (!date) return 'N/A';
	return new Date(date).toLocaleDateString('uk');
};

// In your utils/functions file
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

export const getAspectRatio = (width: number, height: number): string => {
	const gcd = (a: number, b: number): number => {
		return b === 0 ? a : gcd(b, a % b);
	};

	const divisor = gcd(width, height);

	const simplifiedWidth = width / divisor;
	const simplifiedHeight = height / divisor;

	if (simplifiedHeight > 20 || simplifiedWidth > 20) return `${width}x${height}`;

	return `${simplifiedWidth}:${simplifiedHeight}`;
};

export const deepEqual = (obj1: any, obj2: any): boolean => {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
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

export function getDateAndTime(dateString: string) {
	const date = new Date(dateString);

	const formattedDate = date.toISOString().split('T')[0];
	const formattedTime = date.toISOString().split('T')[1].split('.')[0];

	return { date: formattedDate, time: formattedTime };
}

export function maskId(id: string, isAdmin: boolean = false): string {
	if (!id) return '';
	if (isAdmin) return id;
	if (id.length <= 4) return '*'.repeat(id.length);

	const visibleStart = id.slice(0, 2);
	const visibleEnd = id.slice(-2);
	const masked = '*'.repeat(id.length - 4);

	return `${visibleStart}${masked}${visibleEnd}`;
}

export const createPassword = (length = 12): string => {
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lowercase = 'abcdefghijklmnopqrstuvwxyz';
	const numbers = '0123456789';
	const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
	const allChars = uppercase + lowercase + numbers + symbols;

	let password = '';
	password += uppercase[Math.floor(Math.random() * uppercase.length)];
	password += lowercase[Math.floor(Math.random() * lowercase.length)];
	password += numbers[Math.floor(Math.random() * numbers.length)];
	password += symbols[Math.floor(Math.random() * symbols.length)];

	for (let i = password.length; i < length; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	return password
		.split('')
		.sort(() => Math.random() - 0.5)
		.join('');
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
