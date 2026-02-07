import { ChangeEvent, ReactNode } from 'react';

export interface InputCheckboxCustomProps {
	id: string;
	label?: string;
	note?: string;
	wrapperStyles?: string;
	labelStyles?: string;
	inputStyles?: string;
	noteStyles?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	checked?: boolean;
}

export interface LinkProps {
	href?: string;
	children: ReactNode;
	styles?: string;
	onClick?: (e: any) => void;
	target?: '_blank' | '_self' | '_parent' | '_top';
}

export interface ButtonProps {
	children: ReactNode;
	styles?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
	type?: 'button' | 'submit';
	form?: string;
}

export interface BaseInputProps {
	id: string;
	name?: string;
	label?: ReactNode;
	placeholder?: string;
	note?: ReactNode;
	wrapperStyles?: string;
	labelStyles?: string;
	inputStyles?: string;
	noteStyles?: string;
	value?: string;
}

export interface InputTextProps extends BaseInputProps {
	type?: 'text' | 'email' | 'telegram' | 'tel' | 'url' | 'submit' | 'number' | 'search';
	onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	disabled?: boolean;
	multiline?: boolean;
	min?: number;
	max?: number;
	minLength?: number;
	maxLength?: number;
	required?: boolean;
	autocomplete?: boolean;
}
export interface InputTagsProps extends BaseInputProps {
	type?: 'text' | 'email' | 'tel' | 'url' | 'submit' | 'search';
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	maxTags?: number;
	maxLength?: number;
	tags: string[];
	setTags: (tags: string[]) => void;
}

export interface InputTextHiddenProps extends BaseInputProps {
	type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'submit';
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	readOnly?: boolean;
}

export interface InputPasswordProps extends BaseInputProps {
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface InputNumberProps extends BaseInputProps {
	step?: number;
	min?: number;
	max?: number;
	disabled?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>, value: number) => void;
}

export interface InputFileProps extends BaseInputProps {
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	accept?: string;
	onFileSelect?: (files: File[]) => void;
	multiple?: boolean;
}

export interface InputCheckboxProps extends BaseInputProps {
	checked: boolean;
	inputCheckedStyles?: string;
	checkStyles?: string;
	preventBubbling?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export interface InputSwitchProps extends BaseInputProps {
	checked: boolean;
	preventBubbling?: boolean;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	disabled?: boolean;
}

export interface Option {
	value: string;
	label: React.ReactNode;
	disabled?: boolean;
}

export interface InputSelectProps extends BaseInputProps {
	onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
	inputStyles?: string;
	labelStyles?: string;
	wrapperStyles?: string;
	disabled?: boolean;
	value?: string;
	options: Option[];
	placeholder?: string;
	main?: ReactNode;
	direction?: 'auto' | 'down' | 'up';
	fullWidth?: boolean;
	arrowStyles?: string;
	optionStyles?: string;
	search?: boolean;
}

export interface InputCheckboxCustomProps {
	id: string;
	label?: string;
	note?: string;
	wrapperStyles?: string;
	labelStyles?: string;
	inputStyles?: string;
	noteStyles?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	checked?: boolean;
}

export interface DropdownProps {
	options: DropdownOption[];
	onSelect: (value: string) => void;
	isOpen: boolean;
	onClose: () => void;
	triggerRef: React.RefObject<HTMLButtonElement>;
	position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
	className?: string;
	maxHeight?: string;
	minWidth?: string;
}

export interface DropdownOption {
	value: string;
	label: ReactNode;
	disabled?: boolean;
	icon?: ReactNode;
	href?: string;
	onClick?: (e: React.MouseEvent) => void;
	border?: boolean;
	closable?: boolean;
	selectable?: boolean; // New property - defaults to true
	className?: string; // Custom CSS classes for the option
}

export interface RadioOption {
	value: string;
	label: ReactNode;
	disabled?: boolean;
}

export interface RadioProps {
	options: RadioOption[];
	value?: string;
	onChange?: (value: string) => void;
	name: string;
	className?: string;
	radioClassName?: string;
	labelClassName?: string;
	disabled?: boolean;
	direction?: 'vertical' | 'horizontal';
	size?: 'sm' | 'md' | 'lg';
}

export interface MultiSelectProps {
	id?: string;
	name?: string;
	label?: string;
	wrapperStyles?: string;
	inputStyles?: string;
	options: { value: string; label: string }[];
	value: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
}
