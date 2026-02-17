import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DropdownItem {
	id: string;
	label?: string;
	content?: ReactNode;
	disabled?: boolean;
	onClick: () => void;
}

interface DropdownProps {
	isOpen: boolean;
	onClose: () => void;
	trigger: ReactNode;
	items: DropdownItem[];
	emptyMessage?: ReactNode;
	className?: string;
}

export function Dropdown({
	isOpen,
	onClose,
	trigger,
	items,
	emptyMessage = 'No items available',
	className = '',
}: DropdownProps) {
	const triggerRef = useRef<HTMLDivElement | null>(null);
	const panelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				triggerRef.current &&
				!triggerRef.current.contains(target) &&
				panelRef.current &&
				!panelRef.current.contains(target)
			) {
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

	return (
		<>
			<div ref={triggerRef}>{trigger}</div>

			{isOpen &&
				createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div className="fixed inset-0 bg-black/50" onClick={onClose} />
						<div
							ref={panelRef}
							className={`relative w-full max-w-sm bg-surface rounded-xl shadow-lg border border-secondary/20 max-h-[60vh] overflow-y-auto ${className}`}
						>
							{items.length > 0 ? (
								<div className="py-2">
									{items.map((item) => (
										<button
											key={item.id}
											onClick={() => {
												if (!item.disabled) {
													item.onClick();
													onClose();
												}
											}}
											disabled={item.disabled}
											className={`w-full text-left transition ${
												item.disabled ? 'cursor-not-allowed' : 'hover:bg-secondary/10'
											}`}
										>
											{item.content ? (
												item.content
											) : (
												<div className="px-4 py-2 flex items-center gap-2">
													<span className="font-medium text-foreground">{item.label}</span>
												</div>
											)}
										</button>
									))}
								</div>
							) : (
								<div className="px-4 py-3 text-secondary text-sm text-center">{emptyMessage}</div>
							)}
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
