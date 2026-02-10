'use client';

import Footer from '@/components/layout/Footer';
import { PetContext } from '@/features/pets/context/PetContext';
import { Pet } from '@widgetable/types';
import { useState } from 'react';

const PagesLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
	const [pet, setPet] = useState<Pet>();

	return (
		<PetContext.Provider value={{ pet, setPet }}>
			{children}
			{!pet && <Footer />}
		</PetContext.Provider>
	);
};

export default PagesLayout;
