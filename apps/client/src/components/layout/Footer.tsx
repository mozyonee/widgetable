'use client';

import { Home, Message, User } from '@nsmr/pixelart-react';
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
		const baseClasses = 'flex flex-1 items-center justify-center pt-3 pb-7 font-bold';
		const colorClass = isActive(path) ? 'text-primary' : 'text-secondary';
		return `${baseClasses} ${colorClass}`;
	};

	return (
		<footer className="sticky bottom-0 mt-auto bg-white border-t border-secondary/20">
			<nav className="flex">
				<Link href="/friends" replace className={getLinkClassName('/friends')}>
					<Message width={30} height={30} />
				</Link>

				<Link href="/" replace className={getLinkClassName('/')}>
					<Home width={30} height={30} />
				</Link>

				<Link href="/account" replace className={getLinkClassName('/account')}>
					<User width={30} height={30} />
				</Link>
			</nav>
		</footer>
	);
}
