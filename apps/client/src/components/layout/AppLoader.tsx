'use client';

import { useEffect, useState } from 'react';

let dismissed = false;

const AppLoader = () => {
	const [visible, setVisible] = useState(!dismissed);

	useEffect(() => {
		const handler = () => {
			dismissed = true;
			setVisible(false);
		};

		window.addEventListener('app-loaded', handler);
		return () => window.removeEventListener('app-loaded', handler);
	}, []);

	if (!visible) return null;

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 9999,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#FFFBF7',
			}}
		>
			<img
				src="/pets/egg.png"
				alt=""
				style={{
					width: '6rem',
					height: 'auto',
					animation: 'bounceSquash 1s ease-in-out infinite',
				}}
			/>
			<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
				<div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: '#b07070', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
				<div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: '#b07070', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite', animationDelay: '150ms' }} />
				<div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: '#b07070', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite', animationDelay: '300ms' }} />
			</div>
		</div>
	);
};

export default AppLoader;
