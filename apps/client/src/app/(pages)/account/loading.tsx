import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<main className="p-4 grow flex flex-col gap-6">
			<h1 className="font-bold text-3xl text-center text-foreground">Profile</h1>
			<div className="flex flex-col gap-6 items-center bg-white shadow-lg border border-secondary/20 rounded-2xl p-8 w-full">
				<Skeleton className="h-24 w-24 rounded-full" />
				<div className="flex flex-col items-center gap-2 w-full">
					<Skeleton className="h-8 w-3/5" />
					<Skeleton className="h-6 w-4/5" />
				</div>
			</div>
			<div className="flex flex-col gap-4 bg-white shadow-lg border border-secondary/20 rounded-2xl p-6">
				<Skeleton className="h-7 w-2/5" />
				<Skeleton className="h-4 w-3/5" />
				<Skeleton className="h-12 w-full rounded-lg" />
				<Skeleton className="h-12 w-full rounded-lg" />
			</div>
		</main>
	);
}
