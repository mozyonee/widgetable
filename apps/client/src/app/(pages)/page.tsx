'use client';

import PetsPage from '@/features/pets/components/Pets';

export default function Home() {
	return (
		<main className="p-4 grow overflow-y-auto overscroll-contain">
			<PetsPage />
		</main>
	);
}
