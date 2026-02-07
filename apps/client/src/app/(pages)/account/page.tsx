'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { callError, callSuccess } from '@/lib/functions';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserData } from '@/store/slices/userSlice';
import { Camera, CircleUserRound, Power } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const ProfileSkeleton = () => (
	<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8 w-full">
		<Skeleton className="h-24 w-24 rounded-full" />
		<div className="flex flex-col items-center gap-2">
			<Skeleton className="h-8 w-32" />
			<Skeleton className="h-6 w-40" />
		</div>
		<Skeleton className="h-12 w-full" />
	</div>
);

const Account = () => {
	const { logout } = useAuth();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

	const [loading, setLoading] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [imageTimestamp, setImageTimestamp] = useState(Date.now());
	const [username, setUsername] = useState(user?.name || '');

	const handleNameUpdate = async () => {
		if (!user?._id || !username.trim() || username === user.name) return;

		try {
			setLoading(true);
			const response = await api.patch(`/users/${user._id}/name`, { name: username.trim() });
			dispatch(setUserData(response.data));
			callSuccess('Username updated');
		} catch {
			callError('Failed to update name');
			setUsername(user.name || '');
		} finally {
			setLoading(false);
		}
	};

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			return callError('Please select an image file');
		}

		if (file.size > 5 * 1024 * 1024) {
			return callError('Image size should be less than 5MB');
		}

		try {
			setLoading(true);
			const formData = new FormData();
			formData.append('picture', file);

			const response = await api.patch(`/users/${user?._id}/picture`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			dispatch(setUserData(response.data));
			setImageError(false);
			setImageTimestamp(Date.now());
		} catch {
			callError('Failed to upload image');
		} finally {
			setLoading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	};

	const handleBlur = () => {
		if (updateTimerRef.current) {
			clearTimeout(updateTimerRef.current);
			updateTimerRef.current = null;
		}
		handleNameUpdate();
	};

	useEffect(() => {
		if (user?.name) setUsername(user.name);
	}, [user?.name]);

	useEffect(() => {
		if (!username || username === user?.name) return;

		updateTimerRef.current = setTimeout(handleNameUpdate, 2000);
		return () => {
			if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
		};
	}, [username, user?.name]);

	return (
		<main className="p-4 grow h-full flex flex-col gap-6">
			<h1 className="font-bold text-3xl text-center text-foreground">Profile</h1>
			{!user ? (
				<ProfileSkeleton />
			) : (
				<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8">
					<div className="relative">
						<button className="relative" onClick={() => fileInputRef.current?.click()} disabled={loading}>
							<div className="w-24 h-24 rounded-full bg-background flex items-center justify-center">
								{!imageError && user._id ? (
									<Image
										src={`${process.env.NEXT_PUBLIC_SERVER_URL}/users/${user._id}/picture?t=${imageTimestamp}`}
										alt="Profile picture"
										height={96}
										width={96}
										className="rounded-full object-cover h-24 w-24"
										onError={() => setImageError(true)}
									/>
								) : (
									<CircleUserRound strokeWidth={2} size={75} color="var(--secondary)" />
								)}
							</div>
							{loading && (
								<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
									<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
								</div>
							)}
							<div className="absolute bottom-0 right-0 bg-primary/75 p-2 rounded-full cursor-pointer">
								<Camera strokeWidth={2} size={15} color="var(--background)" />
							</div>
						</button>
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
					</div>

					<div className="text-center">
						<InputTextHidden
							id={`username-${user._id}`}
							value={username}
							placeholder="User Name"
							inputStyles="text-2xl font-bold text-foreground"
							onChange={(e) => setUsername(e.target.value)}
							onBlur={handleBlur}
						/>
						<p className="text-secondary">{user.email}</p>
					</div>
				</div>
			)}
			<Button variant="danger" size="lg" onClick={logout} style="flex justify-center items-center gap-2">
				Log Out
				<Power strokeWidth={3} size={20} color="var(--danger)" />
			</Button>
		</main>
	);
};

export default Account;
