export const Skeleton = ({ className }: { className?: string }) => {
	return <div className={`animate-pulse rounded-md bg-secondary/20 ${className}`} />;
};
