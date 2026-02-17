import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<div className="h-full flex flex-col overflow-hidden">
			{/* Header */}
			<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full p-4 flex-shrink-0 bg-surface rounded-b-2xl shadow-md border-b border-secondary/20">
				<Skeleton className="h-10 w-10 rounded-lg" />
				<div className="flex flex-col items-center gap-1">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-5 w-24" />
				</div>
				<Skeleton className="h-10 w-10 rounded-lg justify-self-end" />
			</div>

			{/* Content Area */}
			<div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
				<Skeleton className="h-10 w-48 rounded-xl" />
				<Skeleton className="h-[200px] w-[200px] rounded-full" />
			</div>

			{/* Action Menu */}
			<div className="bg-surface rounded-t-2xl shadow-md border-t border-secondary/20 h-[40dvh] flex flex-col flex-shrink-0">
				<div className="flex justify-center px-4 flex-shrink-0 gap-4 border-b border-secondary/20 py-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
				</div>
				<div className="p-4">
					<div className="grid grid-cols-3 gap-2">
						<Skeleton className="aspect-square rounded-lg" />
						<Skeleton className="aspect-square rounded-lg" />
						<Skeleton className="aspect-square rounded-lg" />
						<Skeleton className="aspect-square rounded-lg" />
						<Skeleton className="aspect-square rounded-lg" />
						<Skeleton className="aspect-square rounded-lg" />
					</div>
				</div>
			</div>
		</div>
	);
}
