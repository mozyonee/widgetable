'use client';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { callError } from '@/lib/functions';
import { Eye, EyeClosed } from '@nsmr/pixelart-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthPage() {
	const [isLogin, setIsLogin] = useState(true);
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const data = { email, password };
		const endpoint = isLogin ? '/auth/login' : '/auth/register';

		try {
			await api.post(endpoint, data);
			router.push('/');
		} catch (error: any) {
			callError(error.message);
		}
	};

	return (
		<main className="p-4 flex flex-col items-center justify-center grow gap-4">
			<div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg border border-secondary/20">
				<h2 className="text-center text-3xl font-bold text-foreground mb-6">
					{isLogin ? 'Welcome Back' : 'Create Account'}
				</h2>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<input
						required
						type="email"
						name="email"
						placeholder="Email"
						className="bg-background text-foreground placeholder-secondary rounded-lg p-3 border border-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary"
					/>
					<div className="relative">
						<input
							required
							minLength={8}
							type={showPassword ? 'text' : 'password'}
							name="password"
							placeholder="Password"
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
						{isLogin ? 'Login' : 'Register'}
					</Button>
				</form>
				<p className="text-center text-secondary mt-6">
					{isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
					<button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline">
						{isLogin ? 'Register' : 'Login'}
					</button>
				</p>
			</div>
		</main>
	);
}
