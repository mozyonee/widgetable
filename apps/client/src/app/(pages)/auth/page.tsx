'use client';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';
import api from '@/lib/api';
import { callError } from '@/lib/functions';
import { useAppDispatch } from '@/store';
import { setAuthenticated, setToken, setUserData } from '@/store/slices/userSlice';
import { Eye, EyeClosed } from '@nsmr/pixelart-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthPage() {
	const { t } = useTranslation();
	const [isLogin, setIsLogin] = useState(true);
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const data = { email, password };
		const endpoint = isLogin ? '/auth/login' : '/auth/register';

		try {
			const response = await api.post(endpoint, data);
			const { user, token } = response.data;

			dispatch(setToken(token));
			dispatch(setUserData(user));
			dispatch(setAuthenticated(true));

			router.push('/');
		} catch (error) {
			callError(t('auth.failedAuth'));
		}
	};

	return (
		<main className="p-4 flex flex-col items-center justify-center grow gap-4">
			<div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg border border-secondary/20">
				<h2 className="text-center text-3xl font-bold text-foreground mb-6">
					{isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
				</h2>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<input
						required
						type="email"
						name="email"
						placeholder={t('auth.email')}
						className="bg-background text-foreground placeholder-secondary rounded-lg p-3 border border-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary"
					/>
					<div className="relative">
						<input
							required
							minLength={8}
							type={showPassword ? 'text' : 'password'}
							name="password"
							placeholder={t('auth.password')}
							className="bg-background text-foreground placeholder-secondary rounded-lg p-3 border border-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary w-full pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
						>
							{showPassword ? <Eye width={20} height={20} /> : <EyeClosed width={20} height={20} />}
						</button>
					</div>
					<Button type="submit" size="lg" style="mt-2 w-full">
						{isLogin ? t('auth.login') : t('auth.register')}
					</Button>
				</form>
				<p className="text-center text-secondary mt-6">
					{isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
					<button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline">
						{isLogin ? t('auth.register') : t('auth.login')}
					</button>
				</p>
			</div>
		</main>
	);
}
