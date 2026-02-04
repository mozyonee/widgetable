'use client';

import { PetContext } from '@/features/pets/context/PetContext';
import { useAuth } from '@/store/hooks/useAuth';
import { CircleUserRound, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext } from 'react';

export default function Footer() {
	const { isAuthenticated } = useAuth();
	const pathname = usePathname();
	const { setPet } = useContext(PetContext);

	return (
		<footer className="sticky bottom-0 mt-auto bg-white border-t border-secondary/20">
			<nav className="flex justify-evenly px-4 pt-4 pb-8">
				<Link
					href={`/`}
					className={`flex flex-col items-center justify-end gap-1 font-bold ${pathname === '/' ? 'text-primary' : 'text-secondary'}`}
				>
					<Home size={30} />
				</Link>

				<Link
					href={isAuthenticated ? '/account' : '/auth'}
					className={`flex flex-col items-center justify-end gap-1 font-bold ${pathname === '/account' || pathname === '/auth' ? 'text-primary' : 'text-secondary'}`}
				>
					<CircleUserRound size={30} />
				</Link>
			</nav>
		</footer>
	);
}
