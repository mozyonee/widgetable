import { useRef } from 'react';
import toast, { Toast } from 'react-hot-toast';

const SWIPE_THRESHOLD = 60;

const useSwipeToDismiss = (id: Toast['id']) => {
	const startY = useRef<number | null>(null);

	const onTouchStart = (e: React.TouchEvent) => {
		startY.current = e.touches[0].clientY;
	};

	const onTouchEnd = (e: React.TouchEvent) => {
		if (startY.current === null) return;
		const delta = startY.current - e.changedTouches[0].clientY;
		if (delta > SWIPE_THRESHOLD) toast.dismiss(id);
		startY.current = null;
	};

	return { onTouchStart, onTouchEnd };
};

const ToastContent = ({ t, text }: { t: Toast; text: string }) => {
	const swipe = useSwipeToDismiss(t.id);
	return (
		<div onClick={() => toast.dismiss(t.id)} {...swipe}>
			<p className="text-lg">{text}</p>
		</div>
	);
};

export const callSuccess = (text: string) => {
	toast.success((t) => <ToastContent t={t} text={text} />, {
		duration: 3000,
		style: {
			zIndex: 10000,
			border: '1px solid var(--primary)',
			backgroundColor: 'var(--background)',
			padding: '16px',
			color: 'var(--foreground)',
		},
	});
};

export const callError = (text: string) => {
	toast.error((t) => <ToastContent t={t} text={text} />, {
		duration: 3000,
		style: {
			zIndex: 10000,
			border: '1px solid var(--danger)',
			backgroundColor: 'var(--background)',
			padding: '16px',
			color: 'var(--foreground)',
		},
	});
};
