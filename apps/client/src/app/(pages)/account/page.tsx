'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { setUserData } from '@/features/auth/slices/userSlice';
import { ItemButton } from '@/features/items/components/ItemButton';
import { ItemsModal } from '@/features/items/components/ItemsModal';
import { useItems } from '@/features/items/hooks/useItems';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import api from '@/lib/api';
import { useImagesLoaded } from '@/lib/hooks/useImagesLoaded';
import { callError, callSuccess } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { Camera, Power, User as UserIcon } from '@nsmr/pixelart-react';
import { ClaimType, LANGUAGES, User } from '@widgetable/types';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

const ProfileSkeleton = () => (
	<>
		<div className="flex flex-col gap-6 items-center bg-surface shadow-lg border border-secondary/20 rounded-2xl p-8 w-full">
			<Skeleton className="h-24 w-24 rounded-full" />
			<div className="flex flex-col items-center gap-2 w-full">
				<Skeleton className="h-8 w-3/5" />
				<Skeleton className="h-6 w-4/5" />
			</div>
		</div>
		<div className="flex flex-col gap-4 bg-surface shadow-lg border border-secondary/20 rounded-2xl p-6">
			<Skeleton className="h-7 w-2/5" />
			<Skeleton className="h-4 w-3/5" />
			<Skeleton className="h-12 w-full rounded-lg" />
			<Skeleton className="h-12 w-full rounded-lg" />
		</div>
		<div className="flex flex-col gap-4 bg-surface shadow-lg border border-secondary/20 rounded-2xl p-6">
			<Skeleton className="h-7 w-1/3" />
			<div className="flex gap-2">
				<Skeleton className="h-12 flex-1 rounded-xl" />
				<Skeleton className="h-12 flex-1 rounded-xl" />
			</div>
		</div>
		<Skeleton className="h-12 w-full rounded-lg" />
	</>
);

const Account = () => {
	const { logout } = useAuth();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.userData);
	const { t, language, setLanguage } = useTranslation();
	const { itemStatus, claimingType, lastItems, claimDaily, claimQuick, closeItemsModal } = useItems();
	const {
		isSupported,
		isSubscribed,
		permission,
		loading: notifLoading,
		subscribe,
		unsubscribe,
	} = usePushNotifications();

	const fileInputRef = useRef<HTMLInputElement>(null);
	const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

	const [loading, setLoading] = useState(false);
	const [imageError, setImageError] = useState(false);
	const [imageTimestamp, setImageTimestamp] = useState(Date.now());
	const [username, setUsername] = useState(user?.name || '');

	const avatarUrl = user?.picture ? `${process.env.NEXT_PUBLIC_SERVER_URL}/users/${user._id}/picture` : '';
	const avatarLoaded = useImagesLoaded(useMemo(() => [avatarUrl], [avatarUrl]));

	const handleNameUpdate = async () => {
		if (!username.trim() || username === user?.name) return;

		try {
			setLoading(true);
			const response = await api.patch<User>('/users/name', { name: username.trim() });
			dispatch(setUserData(response.data));
			callSuccess(t('account.usernameUpdated'));
		} catch {
			callError(t('account.failedUpdateName'));
			setUsername(user?.name || '');
		} finally {
			setLoading(false);
		}
	};

	const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			return callError(t('account.selectImage'));
		}

		if (file.size > 5 * 1024 * 1024) {
			return callError(t('account.imageTooLarge'));
		}

		try {
			setLoading(true);
			const formData = new FormData();
			formData.append('picture', file);

			const response = await api.patch<User>('/users/picture', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			dispatch(setUserData(response.data));
			setImageError(false);
			setImageTimestamp(Date.now());
		} catch {
			callError(t('account.failedUploadImage'));
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
		void handleNameUpdate();
	};

	useEffect(() => {
		if (user?.name) setUsername(user.name);
	}, [user?.name]);

	useEffect(() => {
		if (!username || username === user?.name) return;

		updateTimerRef.current = setTimeout(() => void handleNameUpdate(), 2000);
		return () => {
			if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
		};
	}, [username, user?.name]);

	return (
		<main className="p-4 grow flex flex-col gap-6">
			<h1 className="font-bold text-3xl text-center text-foreground">{t('account.profile')}</h1>
			{!user || !avatarLoaded ? (
				<ProfileSkeleton />
			) : (
				<>
					<div className="flex flex-col gap-6 items-center bg-surface shadow-lg border border-secondary/20 rounded-2xl p-8">
						<div className="relative">
							<button
								className="relative"
								onClick={() => fileInputRef.current?.click()}
								disabled={loading}
							>
								<div className="w-24 h-24 rounded-full bg-background flex items-center justify-center">
									{user.picture && !imageError ? (
										<Image
											src={`${process.env.NEXT_PUBLIC_SERVER_URL}/users/${user._id}/picture?t=${imageTimestamp}`}
											alt="Profile picture"
											height={96}
											width={96}
											className="rounded-full object-cover h-24 w-24"
											onError={() => setImageError(true)}
										/>
									) : (
										<UserIcon width={75} height={75} className="text-secondary" />
									)}
								</div>
								{loading && (
									<div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
										<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
									</div>
								)}
								<div className="absolute bottom-0 right-0 bg-primary/75 p-2 rounded-full cursor-pointer">
									<Camera width={15} height={15} className="text-background" />
								</div>
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={(e) => void handleImageUpload(e)}
								className="hidden"
							/>
						</div>

						<div className="text-center min-w-4 w-full overflow-hidden">
							<InputTextHidden
								id={`username-${user._id}`}
								value={username}
								placeholder={t('account.usernamePlaceholder')}
								inputStyles="text-2xl font-bold text-foreground truncate"
								maxLength={16}
								onChange={(e) => setUsername(e.target.value)}
								onBlur={handleBlur}
							/>
							<p className="text-secondary truncate">{user.email}</p>
						</div>
					</div>

					<div className="flex flex-col gap-4 bg-surface shadow-lg border border-secondary/20 rounded-2xl p-6">
						<h2 className="font-bold text-xl text-foreground">{t('account.carePackages')}</h2>
						<p className="text-secondary text-sm">{t('account.carePackagesDesc')}</p>

						{itemStatus && (
							<div className="space-y-3">
								<ItemButton
									type={ClaimType.DAILY}
									available={itemStatus.available[ClaimType.DAILY]}
									claimingType={claimingType}
									nextItemTime={itemStatus.nextClaimTime[ClaimType.DAILY]}
									onClaim={() => void claimDaily()}
								/>
								<ItemButton
									type={ClaimType.QUICK}
									available={itemStatus.available[ClaimType.QUICK]}
									claimingType={claimingType}
									nextItemTime={itemStatus.nextClaimTime[ClaimType.QUICK]}
									onClaim={() => void claimQuick()}
								/>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-4 bg-surface shadow-lg border border-secondary/20 rounded-2xl p-6">
						<h2 className="font-bold text-xl text-foreground">{t('account.language')}</h2>
						<div className="flex gap-2">
							{LANGUAGES.map((lang) => (
								<button
									key={lang.code}
									onClick={() => setLanguage(lang.code)}
									className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors border-2 ${
										language === lang.code
											? 'border-primary bg-primary/10 text-primary'
											: 'border-secondary/20 bg-background text-foreground hover:border-primary/50'
									}`}
								>
									{lang.nativeLabel}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-4 bg-surface shadow-lg border border-secondary/20 rounded-2xl p-6">
						<h2 className="font-bold text-xl text-foreground">{t('account.notifications')}</h2>
						{!isSupported ? (
							<p className="text-secondary text-sm">{t('account.notificationsNotSupported')}</p>
						) : permission === 'denied' ? (
							<p className="text-secondary text-sm">{t('account.notificationsDenied')}</p>
						) : isSubscribed ? (
							<Button
								variant="secondary"
								size="md"
								style="w-full"
								onClick={() => void unsubscribe()}
								disabled={notifLoading}
							>
								{t('account.disableNotifications')}
							</Button>
						) : (
							<Button
								variant="primary"
								size="md"
								style="w-full"
								onClick={() => void subscribe()}
								disabled={notifLoading}
							>
								{t('account.enableNotifications')}
							</Button>
						)}
					</div>

					<Button
						variant="danger"
						size="lg"
						onClick={() => void logout()}
						style="flex justify-center items-center gap-2"
					>
						{t('account.logOut')}
						<Power width={20} height={20} className="text-danger" />
					</Button>
				</>
			)}

			{lastItems && <ItemsModal result={lastItems} onClose={closeItemsModal} />}
		</main>
	);
};

export default Account;
