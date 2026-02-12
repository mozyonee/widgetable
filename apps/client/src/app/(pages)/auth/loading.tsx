export default function Loading() {
	return (
		<div className="flex flex-col items-center justify-center grow bg-background">
			<div className="flex flex-col items-center gap-4">
				<img src="/pets/egg.png" alt="Loading" className="w-24 h-auto bounce-squash" />
				<div className="flex gap-2">
					<div className="rounded-xs size-3 bg-primary brightness-75 animate-pulse" style={{ animationDelay: '0ms' }} />
					<div className="rounded-xs size-3 bg-primary brightness-75 animate-pulse" style={{ animationDelay: '150ms' }} />
					<div className="rounded-xs size-3 bg-primary brightness-75 animate-pulse" style={{ animationDelay: '300ms' }} />
				</div>
			</div>
		</div>
	);
}
