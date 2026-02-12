import AppLoader from '@/components/layout/AppLoader';
import PwaWarning from '@/components/layout/PwaWarning';
import AuthRoute from '@/features/auth/components/AuthRoute';
import { TranslationProvider } from '@/i18n/TranslationProvider';
import ReduxProvider from '@/store/provider';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Widgetable',
	description: 'Widgetable',
	generator: 'Next.js',
	manifest: '/manifest.json',
	keywords: ['nextjs', 'next14', 'pwa', 'next-pwa'],
	icons: [
		{ rel: 'apple-touch-icon', url: 'icon-192x192.png' },
		{ rel: 'icon', url: 'icon-192x192.png' },
	],
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Widgetable',
	},
};

export const viewport: Viewport = {
	themeColor: '#FFFBF7',
	width: 'device-width',
	initialScale: 1,
	minimumScale: 1,
	viewportFit: 'cover',
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	return (
		<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
			<head>
				<style
					dangerouslySetInnerHTML={{
						__html: `
							@keyframes bounceSquash {
								0% { transform: translateY(0) scaleX(1.05) scaleY(0.95); }
								25% { transform: translateY(-1.5rem) scaleX(0.98) scaleY(1.02); }
								50% { transform: translateY(-2rem) scaleX(0.97) scaleY(1.03); }
								75% { transform: translateY(-0.5rem) scaleX(1) scaleY(1); }
								100% { transform: translateY(0) scaleX(1.05) scaleY(0.95); }
							}
							@keyframes pulse {
								0%, 100% { opacity: 1; }
								50% { opacity: 0.5; }
							}
						`,
					}}
				/>
			</head>
			<body className="antialiased h-dvh! overflow-y-auto flex flex-col lg:max-w-[450px] m-auto">
				<AppLoader />
				<ReduxProvider>
					<TranslationProvider>
						<PwaWarning />
						<AuthRoute>
							<Toaster position="top-center" reverseOrder={false} />
							{children}
						</AuthRoute>
					</TranslationProvider>
				</ReduxProvider>
			</body>
		</html>
	);
};

export default RootLayout;
