import toast from 'react-hot-toast';

export const callSuccess = (text: string) => {
	toast.success(
		(t) => (
			<div onClick={() => toast.dismiss(t.id)}>
				<p className='text-lg'>{text}</p>
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
				<p className='text-lg'>{text}</p>
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

export const formatTime = (miliseconds: number) => {
	if (!isFinite(miliseconds) || isNaN(miliseconds) || miliseconds < 0) {
		return "0m0s";
	}

	const units = [
		{ label: "y", value: 365 * 24 * 60 * 60 * 1 * 1000 },
		{ label: "mo", value: 30 * 24 * 60 * 60 * 1 * 1000 },
		{ label: "w", value: 7 * 24 * 60 * 60 * 1 * 1000 },
		{ label: "d", value: 24 * 60 * 60 * 1 * 1000 },
		{ label: "h", value: 60 * 60 * 1 * 1000 },
		{ label: "m", value: 60 * 1 * 1000 },
		{ label: "s", value: 1 * 1000 },
		{ label: "ms", value: 1 },
	];

	let remaining = miliseconds;
	const parts: string[] = [];

	for (const u of units) {
		if (remaining >= u.value) {
			const amount = Math.floor(remaining / u.value);
			parts.push(`${amount}${u.label}`);
			remaining -= amount * u.value;

			if (parts.length === 2) break;
		}
	}

	if (parts.length === 0 && remaining > 0) {
		const ms = remaining;
		parts.push(`${ms}ms`);
	}

	return parts.join("");
}