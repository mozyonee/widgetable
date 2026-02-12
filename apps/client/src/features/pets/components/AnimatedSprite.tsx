import { useEffect, useRef, useState } from 'react';

interface AnimatedSpriteProps {
	sprite: string;
	fps: number;
	loop?: boolean;
	onAnimationEnd?: () => void;
	onLoad?: () => void;
	height?: number | string;
	alt?: string;
}

// Sprite sheets are expected to be horizontal (frames arranged left to right)
const AnimatedSprite = ({
	sprite,
	fps,
	loop = true,
	onAnimationEnd,
	onLoad,
	height = 500,
	alt = 'animated sprite',
}: AnimatedSpriteProps) => {
	const [currentFrame, setCurrentFrame] = useState(0);
	const [dimensions, setDimensions] = useState<{ frames: number; frameSize: number } | null>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const animationFrameRef = useRef<number>(0);
	const lastFrameTimeRef = useRef<number>(0);

	const frameDelay = 1000 / fps;

	// Load sprite and calculate dimensions
	useEffect(() => {
		const image = new Image();
		image.src = sprite;
		imageRef.current = image;

		image.onload = () => {
			// Calculate frame dimensions from image
			// Frames are square, so frameSize = height
			const frameSize = image.naturalHeight;
			const frames = Math.floor(image.naturalWidth / frameSize);

			setDimensions({ frames, frameSize });
			onLoad?.();
		};

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [sprite]);

	// Animation loop
	useEffect(() => {
		if (!dimensions) return;

		const canvas = canvasRef.current;
		const image = imageRef.current;
		if (!canvas || !image) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const drawFrame = (frameIndex: number) => {
			if (!image.complete) return;

			// Clear the canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Calculate the source position in the sprite sheet
			const sx = frameIndex * dimensions.frameSize;
			const sy = 0;

			// Draw the current frame
			ctx.drawImage(
				image,
				sx,
				sy,
				dimensions.frameSize,
				dimensions.frameSize,
				0,
				0,
				dimensions.frameSize,
				dimensions.frameSize
			);
		};

		// Draw initial frame
		drawFrame(0);

		let frameCount = 0;
		lastFrameTimeRef.current = performance.now();

		const animate = (currentTime: number) => {
			if (!image.complete) {
				animationFrameRef.current = requestAnimationFrame(animate);
				return;
			}

			const elapsed = currentTime - lastFrameTimeRef.current;

			if (elapsed >= frameDelay) {
				frameCount++;

				if (frameCount >= dimensions.frames) {
					if (loop) {
						frameCount = 0;
					} else {
						frameCount = dimensions.frames - 1;
						onAnimationEnd?.();
						return;
					}
				}

				drawFrame(frameCount);
				setCurrentFrame(frameCount);
				lastFrameTimeRef.current = currentTime;
			}

			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [dimensions, frameDelay, loop, onAnimationEnd]);

	if (!dimensions) {
		// Return placeholder while loading
		const heightStyle = typeof height === 'number' ? `${height}px` : height;
		return <div style={{ width: heightStyle, height: heightStyle }} />;
	}

	// Calculate scale based on desired height and actual frame size
	const heightNum = typeof height === 'number' ? height : 500;
	const scale = heightNum / dimensions.frameSize;

	return (
		<canvas
			ref={canvasRef}
			width={dimensions.frameSize}
			height={dimensions.frameSize}
			style={{
				width: `${dimensions.frameSize * scale}px`,
				height: `${dimensions.frameSize * scale}px`,
				imageRendering: 'pixelated',
			}}
			aria-label={alt}
		/>
	);
};

export default AnimatedSprite;
