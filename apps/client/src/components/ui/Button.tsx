import { InputTextHiddenProps } from '@/types/buttons.types';
import { useEffect, useRef, useState } from 'react';

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
		<button {...props} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${style}`}>
			{children}
		</button>
	);
};

export const InputTextHidden = ({
	id,
	value = '',
	placeholder = '',
	onChange,
	readOnly,
	inputStyles = '',
}: InputTextHiddenProps) => {
	return (
		<input
			id={id}
			value={value}
			placeholder={placeholder}
			onChange={onChange}
			readOnly={readOnly}
			size={Math.max(value.length, placeholder.length, 1)}
			className={`bg-transparent text-center outline-none w-fit ${inputStyles}`}
		/>
	);
};
