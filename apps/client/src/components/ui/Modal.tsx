'use client';

import { Close } from '@nsmr/pixelart-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	titleIcon?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	lockScroll?: boolean;
	clickOutsideToClose?: boolean;
	preventTouchMove?: boolean;
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	headerClassName?: string;
	contentClassName?: string;
}

const maxWidthClasses = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl',
	'2xl': 'max-w-2xl',
};

export const Modal = ({
	isOpen,
	onClose,
	title,
	titleIcon,
	children,
	footer,
	lockScroll = false,
	clickOutsideToClose = true,
	preventTouchMove = false,
	maxWidth = 'sm',
	headerClassName = 'bg-primary text-white',
	contentClassName = '',
}: ModalProps) => {
	const [mounted, setMounted] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);
	const scrollYRef = useRef(0);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen || !lockScroll) return;

		scrollYRef.current = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${scrollYRef.current}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';

		return () => {
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.left = '';
			document.body.style.right = '';
			window.scrollTo(0, scrollYRef.current);
		};
	}, [isOpen, lockScroll]);

	useEffect(() => {
		if (!isOpen || !clickOutsideToClose) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose, clickOutsideToClose]);

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (clickOutsideToClose && e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (preventTouchMove) {
			e.preventDefault();
		}
	};

	if (!isOpen || !mounted) return null;

	const modalContent = (
		<div
			className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
			onClick={handleBackdropClick}
			onTouchMove={handleTouchMove}
		>
			<div
				ref={modalRef}
				className={`bg-surface rounded-2xl shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-[scaleIn_0.3s_ease-out] ${maxWidthClasses[maxWidth]}`}
				onClick={(e) => e.stopPropagation()}
				onTouchMove={(e) => preventTouchMove && e.stopPropagation()}
			>
				{title && (
					<div
						className={`flex items-center justify-between p-4 border-b border-secondary/20 ${headerClassName}`}
					>
						<h2 className="text-xl font-bold flex items-center gap-2">
							{titleIcon}
							{title}
						</h2>
						<button
							onClick={onClose}
							className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
							aria-label="Close"
						>
							<Close width={24} height={24} />
						</button>
					</div>
				)}

				<div className={`overflow-y-auto ${contentClassName}`}>{children}</div>
				{footer && <div className="sticky bottom-0 border-t border-secondary bg-surface p-4 rounded-b-2xl">{footer}</div>}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};
