'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';

type Platform = 'ios' | 'android' | 'other';

const getPlatform = (): Platform => {
	const ua = navigator.userAgent;
	if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
	if (/Android/.test(ua)) return 'android';
	return 'other';
};

const PwaWarning = () => {
	const [show, setShow] = useState(false);
	const [platform, setPlatform] = useState<Platform>('other');
	const { t } = useTranslation();

	useEffect(() => {
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as any).standalone === true;

		if (!isStandalone) {
			setPlatform(getPlatform());
			setShow(true);
		}
	}, []);

	if (!show) return null;

	return (
		<div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-6">
			<div className="bg-background rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 animate-[scaleIn_0.2s_ease-out]">
				<h2 className="text-lg font-bold text-foreground text-center">
					{t('pwa.warning')}
				</h2>

				<p className="text-sm text-foreground/70 text-center">
					{t('pwa.description')}
				</p>

				{platform === 'ios' && (
					<div className="bg-foreground/5 rounded-xl p-4 flex flex-col gap-2">
						<p className="text-sm font-semibold text-foreground">
							{t('pwa.iosTitle')}
						</p>
						<ol className="text-sm text-foreground/70 list-decimal list-inside flex flex-col gap-1">
							<li>{t('pwa.iosStep1')}</li>
							<li>{t('pwa.iosStep2')}</li>
							<li>{t('pwa.iosStep3')}</li>
						</ol>
					</div>
				)}

				{platform === 'android' && (
					<div className="bg-foreground/5 rounded-xl p-4 flex flex-col gap-2">
						<p className="text-sm font-semibold text-foreground">
							{t('pwa.androidTitle')}
						</p>
						<ol className="text-sm text-foreground/70 list-decimal list-inside flex flex-col gap-1">
							<li>{t('pwa.androidStep1')}</li>
							<li>{t('pwa.androidStep2')}</li>
						</ol>
					</div>
				)}

				{platform === 'other' && (
					<div className="bg-foreground/5 rounded-xl p-4 flex flex-col gap-2">
						<p className="text-sm font-semibold text-foreground">
							{t('pwa.desktopTitle')}
						</p>
						<ol className="text-sm text-foreground/70 list-decimal list-inside flex flex-col gap-1">
							<li>{t('pwa.desktopStep1')}</li>
							<li>{t('pwa.desktopStep2')}</li>
						</ol>
					</div>
				)}

				<Button
					variant="primary"
					size="lg"
					style="w-full mt-2"
					onClick={() => setShow(false)}
				>
					{t('pwa.continueAnyway')}
				</Button>
			</div>
		</div>
	);
};

export default PwaWarning;
