'use client';

import PetPage from '@/features/pets/components/Pet';
import PetsPage from '@/features/pets/components/Pets';
import { PetContext } from '@/features/pets/context/PetContext';
import { useContext } from 'react';

export default function Home() {
	const { pet } = useContext(PetContext);

	return (
		<main className={`${pet ? '' : 'p-4'} grow overflow-y-auto overscroll-contain`}>
			{pet ? <PetPage /> : <PetsPage />}
		</main>
	);
}
