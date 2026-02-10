'use client';

import { Button } from '@/components/ui/Button';
import { Image, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const BACKGROUNDS = Array.from({ length: 20 }, (_, i) => i + 1);

interface BackgroundSelectorProps {
	petId: string;
	onSelect: (backgroundId: number | null) => void;
	currentBackground: number | null;
}

export const BackgroundSelector = ({ petId, onSelect, currentBackground }: BackgroundSelectorProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	const handleSelect = (backgroundId: number | null) => {
		onSelect(backgroundId);
		setIsOpen(false);
	};

	return (
		<>
			<Button
				style="aspect-square w-fit"
				variant="ghost"
				size="sm"
				onClick={() => setIsOpen(true)}
				title="Change background"
			>
				<Image strokeWidth={2} size={20} color="var(--primary)" />
			</Button>

			{isOpen && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
					<div
						ref={modalRef}
						className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
					>
						<div className="flex items-center justify-between p-4 border-b border-secondary/20">
							<h2 className="text-xl font-bold text-foreground">Select Background</h2>
							<button
								onClick={() => setIsOpen(false)}
								className="text-secondary hover:text-foreground transition"
							>
								<X size={24} />
							</button>
						</div>

						<div className="overflow-y-auto p-4">
							<div className="grid grid-cols-3 gap-3 mb-4">
								{/* No Background option */}
								<button
									onClick={() => handleSelect(null)}
									className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-all ${currentBackground === null
											? 'border-primary ring-2 ring-primary/20'
											: 'border-secondary/20 hover:border-primary/50'
										}`}
								>
									<div className="absolute inset-0 flex items-center justify-center bg-secondary/10">
										<X size={32} className="text-secondary" />
									</div>
									<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
										None
									</div>
								</button>

								{/* Background options */}
								{BACKGROUNDS.map((bgId) => (
									<button
										key={bgId}
										onClick={() => handleSelect(bgId)}
										className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-all ${currentBackground === bgId
												? 'border-primary ring-2 ring-primary/20'
												: 'border-secondary/20 hover:border-primary/50'
											}`}
									>
										<img
											src={`/backgrounds/${bgId}.png`}
											alt={`Background ${bgId}`}
											className="w-full h-full object-cover"
										/>
										<div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
											Background {bgId}
										</div>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
