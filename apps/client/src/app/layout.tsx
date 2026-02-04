import AuthRoute from '@/features/auth/components/AuthRoute';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import ReduxProvider from '@/store/provider';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Your app name',
	description: 'Your app description',
	generator: 'Next.js',
	manifest: '/manifest.json',
	keywords: ['nextjs', 'next14', 'pwa', 'next-pwa'],
	icons: [
		{ rel: 'apple-touch-icon', url: 'icon-192x192.png' },
		{ rel: 'icon', url: 'icon-192x192.png' },
	],
};

export const viewport: Viewport = {
	themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#fff' }],
	width: 'device-width',
	initialScale: 1,
	minimumScale: 1,
	viewportFit: 'cover',
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} 
				antialiased h-dvh! overflow-hidden
				flex flex-col max-w-[450px] m-auto border-x border-secondary
				`}
			>
				<ReduxProvider>
					<AuthRoute>
						<Toaster position="top-center" reverseOrder={false} />
						{children}
					</AuthRoute>
				</ReduxProvider>
			</body>
		</html>
	);
};

export default RootLayout;
