'use client';

import { useTranslation } from '@/i18n/useTranslation';
import { Close } from '@nsmr/pixelart-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const BACKGROUNDS = Array.from({ length: 20 }, (_, i) => i + 1);

interface BackgroundSelectorProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (backgroundId: number | null) => void;
	currentBackground: number | null;
}

export const BackgroundSelector = ({ isOpen, onClose, onSelect, currentBackground }: BackgroundSelectorProps) => {
	const { t } = useTranslation();
	const [mounted, setMounted] = useState(false);
	const [randomPreview, setRandomPreview] = useState(() => Math.floor(Math.random() * 20) + 1);
	const modalRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (isOpen) {
			setRandomPreview(Math.floor(Math.random() * 20) + 1);
		}
	}, [isOpen]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleSelect = (backgroundId: number | null) => {
		onSelect(backgroundId);
		onClose();
	};

	const modalContent = isOpen && mounted ? (
		<div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
			<div
				ref={modalRef}
				className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
			>
				<div className="flex items-center justify-between p-4 border-b border-secondary/20">
					<h2 className="text-xl font-bold text-foreground">{t('pets.selectBackground')}</h2>
					<button
						onClick={onClose}
						className="text-secondary hover:text-foreground transition"
					>
						<Close width={24} height={24} />
					</button>
				</div>

				<div className="overflow-y-auto p-4">
					<div className="grid grid-cols-3 gap-3 mb-4">
						{/* Random Background option */}
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

						{/* Background options */}
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
				</div>
			</div>
		</div>
	) : null;

	return mounted && modalContent ? createPortal(modalContent, document.body) : null;
};
