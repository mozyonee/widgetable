import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<main className="p-4 grow overflow-y-auto overscroll-contain">
			<div className="flex flex-col gap-4 h-full">
				<h1 className="font-bold text-3xl text-foreground text-center">Friends</h1>
				<div className="bg-white rounded-2xl shadow-md border border-secondary/20 p-4">
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="flex flex-col gap-4">
					<div className="bg-white rounded-2xl p-4 shadow-md border border-secondary/20 flex items-center gap-4">
						<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
						<div className="flex-1">
							<Skeleton className="h-5 w-3/5 mb-2" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</div>
					<div className="bg-white rounded-2xl p-4 shadow-md border border-secondary/20 flex items-center gap-4">
						<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
						<div className="flex-1">
							<Skeleton className="h-5 w-3/5 mb-2" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
