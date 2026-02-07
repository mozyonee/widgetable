'use client';

import { CircleUserRound, Home, MessageCircleHeart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
	const pathname = usePathname();

	const isActive = (path: string) => {
		if (path === '/account') {
			return pathname === '/account' || pathname === '/auth';
		}
		return pathname === path;
	};

	const getLinkClassName = (path: string) => {
		const baseClasses = 'flex flex-col items-center justify-end gap-1 font-bold';
		const colorClass = isActive(path) ? 'text-primary' : 'text-secondary';
		return `${baseClasses} ${colorClass}`;
	};

	return (
		<footer className="sticky bottom-0 mt-auto bg-white border-t border-secondary/20">
			<nav className="flex justify-evenly px-4 pt-4 pb-8">
				<Link href="/friends" className={getLinkClassName('/friends')}>
					<MessageCircleHeart size={30} />
				</Link>

				<Link href="/" className={getLinkClassName('/')}>
					<Home size={30} />
				</Link>

				<Link href="/account" className={getLinkClassName('/account')}>
					<CircleUserRound size={30} />
				</Link>
			</nav>
		</footer>
	);
}
