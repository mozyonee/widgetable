import { useEffect, useRef, useState } from 'react';

export const useImagesLoaded = (urls: string[]) => {
	const [loaded, setLoaded] = useState(false);
	const loadedOnce = useRef(false);

	useEffect(() => {
		if (loadedOnce.current) return;

		const uniqueUrls = [...new Set(urls.filter(Boolean))];
		if (uniqueUrls.length === 0) {
			loadedOnce.current = true;
			setLoaded(true);
			return;
		}

		let cancelled = false;

		void Promise.all(
			uniqueUrls.map(
				(url) =>
					new Promise<void>((resolve) => {
						const img = new Image();
						img.onload = () => resolve();
						img.onerror = () => resolve();
						img.src = url;
					}),
			),
		).then(() => {
			if (!cancelled) {
				loadedOnce.current = true;
				setLoaded(true);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [urls.join(',')]);

	return loaded;
};
