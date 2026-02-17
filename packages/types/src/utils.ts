export const formatTime = (milliseconds: number): string => {
	if (!isFinite(milliseconds) || isNaN(milliseconds) || milliseconds < 0) {
		return '0m0s';
	}

	const units = [
		{ label: 'y', value: 365 * 24 * 60 * 60 * 1000 },
		{ label: 'mo', value: 30 * 24 * 60 * 60 * 1000 },
		{ label: 'w', value: 7 * 24 * 60 * 60 * 1000 },
		{ label: 'd', value: 24 * 60 * 60 * 1000 },
		{ label: 'h', value: 60 * 60 * 1000 },
		{ label: 'm', value: 60 * 1000 },
		{ label: 's', value: 1000 },
		{ label: 'ms', value: 1 },
	];

	let remaining = milliseconds;
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
		parts.push(`${remaining}ms`);
	}

	return parts.join('');
};
