import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<div className="flex flex-col gap-6 h-full">
			<div className="grid grid-cols-[1fr_auto_1fr] items-center flex-shrink-0">
				<div></div>
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-10 w-20 rounded-full justify-self-end" />
			</div>
			<div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(125px,1fr))]">
				<div className="bg-white rounded-2xl p-2 flex flex-col items-center justify-between gap-4 shadow-md border border-secondary/20">
					<Skeleton className="aspect-square w-full rounded-full" />
					<Skeleton className="h-6 w-full" />
				</div>
				<div className="bg-white rounded-2xl p-2 flex flex-col items-center justify-between gap-4 shadow-md border border-secondary/20">
					<Skeleton className="aspect-square w-full rounded-full" />
					<Skeleton className="h-6 w-full" />
				</div>
				<div className="bg-white rounded-2xl p-2 flex flex-col items-center justify-between gap-4 shadow-md border border-secondary/20">
					<Skeleton className="aspect-square w-full rounded-full" />
					<Skeleton className="h-6 w-full" />
				</div>
			</div>
		</div>
	);
}
