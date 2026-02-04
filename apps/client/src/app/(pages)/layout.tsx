'use client';

import Footer from '@/components/ui/Footer';
import { PetContext } from '@/features/pets/context/PetContext';
import { IPetDocument } from '@/features/pets/types/pet.types';
import { useState } from 'react';

const PagesLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	const [pet, setPet] = useState<IPetDocument>();

	return (
		<PetContext.Provider value={{ pet, setPet }}>
			{children}
			<Footer />
		</PetContext.Provider>
	);
};

export default PagesLayout;
