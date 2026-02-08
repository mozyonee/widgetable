import toast from 'react-hot-toast';

export const callSuccess = (text: string) => {
	toast.success(
		(t) => (
			<div onClick={() => toast.dismiss(t.id)}>
				<p>{text}</p>
			</div>
		),
		{
			duration: 3000,
			style: {
				zIndex: 10000,
				border: '1px solid var(--primary)',
				backgroundColor: 'var(--background)',
				padding: '16px',
				color: 'var(--foreground)',
			},
		},
	);
};

export const callError = (text: string) => {
	toast.error(
		(t) => (
			<div
				onClick={() => {
					toast.dismiss(t.id);
				}}
			>
				<p>{text}</p>
			</div>
		),
		{
			duration: 3000,
			style: {
				zIndex: 10000,
				border: '1px solid var(--danger)',
				backgroundColor: 'var(--background)',
				padding: '16px',
				color: 'var(--foreground)',
			},
		},
	);
};
