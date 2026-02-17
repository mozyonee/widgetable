'use client';

import { Button, InputTextHidden } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ClaimButton } from '@/features/claims/components/ClaimButton';
import { RewardsModal } from '@/features/claims/components/RewardsModal';
import { useClaims } from '@/features/claims/hooks/useClaims';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { useTranslation } from '@/i18n/useTranslation';
import api from '@/lib/api';
import { callError, callSuccess } from '@/lib/functions';
import { useImagesLoaded } from '@/lib/useImagesLoaded';
import { useAppDispatch, useAppSelector } from '@/store';
import { useAuth } from '@/store/hooks/useAuth';
import { setUserData } from '@/store/slices/userSlice';
import { Camera, Power, User } from '@nsmr/pixelart-react';
import { LANGUAGES } from '@widgetable/types';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

const ProfileSkeleton = () => (
	<>
		<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8 w-full">
			<Skeleton className="h-24 w-24 rounded-full" />
			<div className="flex flex-col items-center gap-2 w-full">
				<Skeleton className="h-8 w-3/5" />
				<Skeleton className="h-6 w-4/5" />
			</div>
		</div>
		<div className="flex flex-col gap-4 bg-white shadow-lg border border-secondary/20 rounded-2xl p-6">
			<Skeleton className="h-7 w-2/5" />
			<Skeleton className="h-4 w-3/5" />
			<Skeleton className="h-12 w-full rounded-lg" />
			<Skeleton className="h-12 w-full rounded-lg" />
		</div>
		<div className="flex flex-col gap-4 bg-white shadow-lg border border-secondary/20 rounded-2xl p-6">
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
	const { claimStatus, claimingType, lastRewards, claimDaily, claimQuick, closeRewardsModal } = useClaims();
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
			const response = await api.patch('/users/name', { name: username.trim() });
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

			const response = await api.patch('/users/picture', formData, {
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
		<main className="p-4 grow flex flex-col gap-6">
			<h1 className="font-bold text-3xl text-center text-foreground">{t('account.profile')}</h1>
			{!user || !avatarLoaded ? (
				<ProfileSkeleton />
			) : (
				<>
					<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8">
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
										<User width={75} height={75} className="text-secondary" />
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
								onChange={handleImageUpload}
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

					<div className="flex flex-col gap-4 bg-white shadow-lg border border-secondary/20 rounded-2xl p-6">
						<h2 className="font-bold text-xl text-foreground">{t('account.carePackages')}</h2>
						<p className="text-secondary text-sm">{t('account.carePackagesDesc')}</p>

						{claimStatus && (
							<div className="space-y-3">
								<ClaimButton
									type="daily"
									available={claimStatus.dailyAvailable}
									claimingType={claimingType}
									nextClaimTime={claimStatus.nextDailyTime}
									onClaim={claimDaily}
								/>
								<ClaimButton
									type="quick"
									available={claimStatus.quickAvailable}
									claimingType={claimingType}
									nextClaimTime={claimStatus.nextQuickTime}
									onClaim={claimQuick}
								/>
							</div>
						)}
					</div>

					<div className="flex flex-col gap-4 bg-white shadow-lg border border-secondary/20 rounded-2xl p-6">
						<h2 className="font-bold text-xl text-foreground">{t('account.language')}</h2>
						<div className="flex gap-2">
							{LANGUAGES.map((lang) => (
								<button
									key={lang.code}
									onClick={() => setLanguage(lang.code)}
									className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors border-2 ${language === lang.code
											? 'border-primary bg-primary/10 text-primary'
											: 'border-secondary/20 bg-background text-foreground hover:border-primary/50'
										}`}
								>
									{lang.nativeLabel}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-4 bg-white shadow-lg border border-secondary/20 rounded-2xl p-6">
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
								onClick={unsubscribe}
								disabled={notifLoading}
							>
								{t('account.disableNotifications')}
							</Button>
						) : (
							<Button
								variant="primary"
								size="md"
								style="w-full"
								onClick={subscribe}
								disabled={notifLoading}
							>
								{t('account.enableNotifications')}
							</Button>
						)}
					</div>

					<Button variant="danger" size="lg" onClick={logout} style="flex justify-center items-center gap-2">
						{t('account.logOut')}
						<Power width={20} height={20} className="text-danger" />
					</Button>
				</>
			)}

			{lastRewards && <RewardsModal rewards={lastRewards} onClose={closeRewardsModal} />}
		</main>
	);
};

export default Account;
