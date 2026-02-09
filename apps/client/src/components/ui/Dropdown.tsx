import { ReactNode, useEffect, useRef } from 'react';

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
	align?: 'left' | 'right';
	className?: string;
}

export function Dropdown({
	isOpen,
	onClose,
	trigger,
	items,
	emptyMessage = 'No items available',
	align = 'right',
	className = '',
}: DropdownProps) {
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
		<div className="relative" ref={dropdownRef}>
			{trigger}

			{isOpen && (
				<div
					className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-xl shadow-lg border border-secondary/20 z-10 max-h-60 overflow-y-auto ${className}`}
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
			)}
		</div>
	);
}
