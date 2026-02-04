'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAppSelector } from '@/store';
import { Camera, CircleUserRound, Power } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

const ProfileSkeleton = () => {
	return (
		<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8 w-full">
			<Skeleton className="h-24 w-24 rounded-full" />
			<div className="flex flex-col items-center gap-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-6 w-40" />
			</div>
			<Skeleton className="h-12 w-full" />
		</div>
	);
};

const Account = () => {
	const { logout } = useAuth();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadLoading, setUploadLoading] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [imageTimestamp, setImageTimestamp] = useState(Date.now());

	const handleLogout = async () => {
		await logout();
	};

	const user = useAppSelector((state) => state.user.userData);

	const handleCameraClick = () => {
		fileInputRef.current?.click();
	};

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			alert('Image size should be less than 5MB');
			return;
		}

		try {
			setUploadLoading(true);
			const formData = new FormData();
			formData.append('picture', file);

			await api.patch(`/users/${user?._id}/picture`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			setImageError(false);
			setImageTimestamp(Date.now());
		} catch (error) {
			console.error('Error uploading image:', error);
			alert('Failed to upload image. Please try again.');
		} finally {
			setUploadLoading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	return (
		<main className="p-4 grow h-full flex flex-col gap-6">
			<h1 className="font-bold text-3xl text-center text-foreground">Profile</h1>
			{!user ? (
				<ProfileSkeleton />
			) : (
				<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8">
					<div className="relative">
						<button className="relative" onClick={handleCameraClick} disabled={uploadLoading}>
							<div className="w-24 h-24 rounded-full bg-background flex items-center justify-center">
								{!imageError && user?._id ? (
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
							{uploadLoading && (
								<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
									<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
								</div>
							)}
							<div className="absolute bottom-0 right-0 bg-primary/75 p-2 rounded-full cursor-pointer">
								<Camera strokeWidth={2} size={15} color="var(--background)" />
							</div>
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</div>

					<div className="text-center">
						<InputTextHidden
							id={`username-${user._id}`}
							value={user?.name || 'User Name'}
							inputStyles="text-2xl font-bold text-foreground"
							readOnly
						/>
						<p className="text-secondary">{user?.email}</p>
					</div>
				</div>
			)}
			<Button variant="danger" size="lg" onClick={handleLogout} style="flex justify-center items-center gap-2">
				Log Out
				<Power strokeWidth={3} size={20} color="var(--danger)" />
			</Button>
		</main>
	);
};

export default Account;
