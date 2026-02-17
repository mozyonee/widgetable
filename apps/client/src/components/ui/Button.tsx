import { useEffect, useRef, useState } from 'react';

interface InputTextHiddenProps {
	id: string;
	name?: string;
	placeholder?: string;
	value?: string;
	inputStyles?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	readOnly?: boolean;
	maxLength?: number;
}

export const Button = ({
	children,
	style,
	variant = 'primary',
	size = 'md',
	...props
}: {
	children: React.ReactNode;
	style?: string;
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
	size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
	const baseClasses = 'transition duration-250 rounded-lg font-semibold';

	const variantClasses = {
		primary: 'bg-primary text-white hover:bg-primary/90',
		secondary: 'bg-secondary text-white hover:bg-secondary/90',
		ghost: 'bg-transparent text-foreground hover:bg-primary/10',
		danger: 'bg-transparent text-danger hover:bg-danger/10',
	};

	const sizeClasses = {
		sm: 'px-2 py-1 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
	};

	return (
		<button
			{...props}
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${props.disabled ? 'opacity-50 pointer-events-none' : ''} ${style}`}
		>
			{children}
		</button>
	);
};

export const InputTextHidden = ({
	id,
	value = '',
	placeholder = '',
	onChange,
	onBlur,
	readOnly,
	maxLength,
	inputStyles = '',
}: InputTextHiddenProps) => {
	const spanRef = useRef<HTMLSpanElement>(null);
	const [inputWidth, setInputWidth] = useState<number>(0);
	const displayText = value || placeholder;

	useEffect(() => {
		if (spanRef.current) {
			setInputWidth(spanRef.current.scrollWidth);
		}
	}, [displayText]);

	return (
		<div className="relative inline-grid items-center max-w-full">
			<span
				ref={spanRef}
				aria-hidden="true"
				className={`invisible whitespace-pre col-start-1 row-start-1 ${inputStyles}`}
			>
				{displayText || '\u00A0'}
			</span>
			<input
				id={id}
				value={value}
				placeholder={placeholder}
				onChange={onChange}
				onBlur={onBlur}
				readOnly={readOnly}
				maxLength={maxLength}
				style={{ width: inputWidth > 0 ? `${inputWidth}px` : 'auto' }}
				className={`bg-transparent text-center outline-none col-start-1 row-start-1 min-w-[1ch] max-w-full ${inputStyles}`}
			/>
		</div>
	);
};
