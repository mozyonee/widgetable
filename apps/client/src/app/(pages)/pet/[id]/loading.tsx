import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<main className="grow flex flex-col">
			<Skeleton className="w-full h-[60dvh] rounded-none" />
			<div className="p-4 flex flex-col gap-4">
				<Skeleton className="h-8 w-2/5" />
				<Skeleton className="h-4 w-1/3" />
			</div>
		</main>
	);
}
