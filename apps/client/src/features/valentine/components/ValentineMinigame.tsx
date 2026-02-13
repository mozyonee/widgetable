'use client';

import { useTranslation } from '@/i18n/useTranslation';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

export const VALENTINE_STORAGE_KEY = `valentine-${new Date().getFullYear()}-completed`;

export const isValentineSeason = (): boolean => {
	return new Date().getMonth() === 1; // February
};

export const isValentineCompleted = (): boolean => {
	if (typeof window === 'undefined') return true;
	return localStorage.getItem(VALENTINE_STORAGE_KEY) === 'true';
};

const ValentineMinigame = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const [yesScale, setYesScale] = useState(1);
	const [noPosition, setNoPosition] = useState<{ top: string; left: string } | null>(null);
	const [celebration, setCelebration] = useState(false);

	const hearts = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
		id: i,
		src: i % 2 === 0 ? '/valentine/red_heard.png' : '/valentine/pink_heart.png',
		left: `${Math.random() * 80 + 10}%`,
		delay: `${i * 0.15}s`,
	})), []);

	const handleNo = useCallback(() => {
		setYesScale((prev) => prev + 0.5);

		const maxTop = 70;
		const maxLeft = 70;
		const newTop = Math.floor(Math.random() * maxTop) + 10;
		const newLeft = Math.floor(Math.random() * maxLeft) + 10;
		setNoPosition({ top: `${newTop}%`, left: `${newLeft}%` });
	}, []);

	const handleYes = useCallback(() => {
		setCelebration(true);
		localStorage.setItem(VALENTINE_STORAGE_KEY, 'true');
	}, []);

	const handleContinue = useCallback(() => {
		router.replace('/');
	}, [router]);

	return (
		<div
			className="flex flex-col items-center justify-center grow overflow-hidden"
			style={{ background: 'linear-gradient(135deg, #FFE4E1 0%, #FFC0CB 50%, #FFB6C1 100%)' }}
		>
			{celebration ? (
				<div className="flex flex-col items-center gap-6 animate-[scaleIn_0.5s_ease-out] relative">
					<img
						src="/valentine/4_color_hearts.png"
						alt="hearts"
						className="w-32 h-32 animate-[bounceSquash_1s_ease-in-out_infinite]"
						style={{ imageRendering: 'pixelated' }}
					/>
					<h1 className="text-5xl font-bold text-white drop-shadow-lg">
						{t('valentine.yay')}
					</h1>
					<p className="text-xl text-white/80 text-center">{t('valentine.present')}</p>
					<button
						onClick={handleContinue}
						className="bg-white text-primary font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-white/90 transition-all mt-2"
					>
						{t('valentine.takeLook')}
					</button>
					{hearts.map((heart) => (
						<img
							key={heart.id}
							src={heart.src}
							alt=""
							className="fixed w-8 h-8 animate-[floatUp_2s_ease-out_forwards]"
							style={{
								imageRendering: 'pixelated',
								left: heart.left,
								bottom: '-10%',
								animationDelay: heart.delay,
								opacity: 0,
							}}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center gap-8 p-8 max-w-sm w-full relative h-full justify-center">
					<img
						src="/valentine/red_heard.png"
						alt="heart"
						className="w-24 h-24 animate-[pulse_2s_ease-in-out_infinite]"
						style={{ imageRendering: 'pixelated' }}
					/>
					<h1 className="text-3xl font-bold text-white text-center drop-shadow-lg">
						{t('valentine.question')}
					</h1>
					<div className="flex gap-2">
						<button
							onClick={handleYes}
							className="bg-white text-primary font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-white/90 transition-all z-10"
							style={{ transform: `scale(${yesScale})`, transformOrigin: 'center' }}
						>
							{t('valentine.yes')}
						</button>
						<button
							onClick={handleNo}
							className="bg-white/50 text-foreground font-bold py-2 px-6 rounded-xl transition-all hover:bg-white/70"
							style={
								noPosition
									? { position: 'absolute', top: noPosition.top, left: noPosition.left }
									: {}
							}
						>
							{t('valentine.no')}
						</button>
					</div>
				</div>
			)}

			<style jsx>{`
				@keyframes floatUp {
					0% {
						opacity: 1;
						transform: translateY(0) rotate(0deg);
					}
					100% {
						opacity: 0;
						transform: translateY(-100vh) rotate(360deg);
					}
				}
				@keyframes scaleIn {
					from {
						opacity: 0;
						transform: scale(0.5);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}
			`}</style>
		</div>
	);
};

export default ValentineMinigame;
