'use client';

import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { useImagesLoaded } from '@/lib/hooks/useImagesLoaded';
import { useEffect, useMemo, useState } from 'react';

const BACKGROUNDS = Array.from({ length: 20 }, (_, i) => i + 1);

interface BackgroundSelectorProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (backgroundId: number | null) => void;
	currentBackground: number | null;
}

export const BackgroundSelector = ({ isOpen, onClose, onSelect, currentBackground }: BackgroundSelectorProps) => {
	const { t } = useTranslation();
	const [randomPreview, setRandomPreview] = useState(() => Math.floor(Math.random() * 20) + 1);

	const backgroundUrls = useMemo(() => BACKGROUNDS.map((id) => `/backgrounds/${id}.png`), []);
	const backgroundsLoaded = useImagesLoaded(backgroundUrls);

	useEffect(() => {
		if (isOpen) {
			setRandomPreview(Math.floor(Math.random() * 20) + 1);
		}
	}, [isOpen]);

	const handleSelect = (backgroundId: number | null) => {
		onSelect(backgroundId);
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('pets.selectBackground')}
			maxWidth="2xl"
			headerClassName="bg-surface text-foreground"
			contentClassName="p-4"
		>
			{!backgroundsLoaded ? (
				<div className="grid grid-cols-3 gap-3 mb-4">
					{Array.from({ length: BACKGROUNDS.length + 1 }).map((_, i) => (
						<Skeleton key={i} className="aspect-[9/16] rounded-lg" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-3 gap-3 mb-4">
					<button
						onClick={() => handleSelect(null)}
						className={`relative aspect-[9/16] rounded-lg border-2 overflow-hidden transition-all ${currentBackground === null
							? 'border-primary ring-2 ring-primary/20'
							: 'border-secondary/20 hover:border-primary/50'
							}`}
					>
						<img
							src={`/backgrounds/${randomPreview}.png`}
							alt="Random background"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-white text-6xl font-bold drop-shadow-lg">?</span>
						</div>
						<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
							{t('pets.random')}
						</div>
					</button>

					{BACKGROUNDS.map((bgId) => (
						<button
							key={bgId}
							onClick={() => handleSelect(bgId)}
							className={`relative aspect-[9/16] rounded-lg border-2 overflow-hidden transition-all ${currentBackground === bgId
								? 'border-primary ring-2 ring-primary/20'
								: 'border-secondary/20 hover:border-primary/50'
								}`}
						>
							<img
								src={`/backgrounds/${bgId}.png`}
								alt={t('pets.bgLabel', { id: bgId })}
								className="w-full h-full object-cover"
							/>
							<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
								{t('pets.bgLabel', { id: bgId })}
							</div>
						</button>
					))}
				</div>
			)}
		</Modal>
	);
};
