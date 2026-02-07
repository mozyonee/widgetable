import { Skeleton } from '@/components/ui/Skeleton';
import PetSprite from '@/features/pets/components/PetSprite';
import { PetContext } from '@/features/pets/context/PetContext';
import api from '@/lib/api';
import { callError } from '@/lib/functions';
import { useAppSelector } from '@/store';
import { Pet } from '@widgetable/types';
import { Plus } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';

const PetCardSkeleton = () => {
	return (
		<div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-between gap-4 shadow-md border border-secondary/20">
			<Skeleton className="h-[100px] w-[100px] rounded-full" />
			<Skeleton className="h-6 w-20" />
		</div>
	);
};

const AddPetButton = ({ onClick, variant = 'grid' }: { onClick: () => void; variant?: 'grid' | 'centered' }) => {
	if (variant === 'centered') {
		return (
			<button
				className="bg-primary text-white font-bold rounded-lg py-3 px-6 hover:bg-opacity-90 transition-colors"
				onClick={onClick}
			>
				Add Pet
			</button>
		);
	}

	return (
		<button
			className="bg-white/50 border-2 border-dashed border-secondary/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-300 hover:bg-white"
			onClick={onClick}
		>
			<Plus className="stroke-primary h-8 w-8" />
			<p className="text-lg font-semibold text-primary">Add Pet</p>
		</button>
	);
};

function PetsPage() {
	const user = useAppSelector((state) => state.user.userData);
	const [pets, setPets] = useState<Pet[]>([]);
	const [loading, setLoading] = useState(true);
	const { setPet } = useContext(PetContext);

	useEffect(() => {
		const fetchPets = async () => {
			if (!user?._id) return;
			setLoading(true);
			try {
				const response = await api.get(`/pets/user`);
				setPets(response.data);
			} catch (error: any) {
				callError(error.message);
			} finally {
				setLoading(false);
			}
		};
		fetchPets();
	}, [user?._id]);

	const handleAddPet = async () => {
		try {
			const response = await api.post('/pets');
			setPets((prev) => [...prev, response.data]);
		} catch (error: any) {
			callError(error.response?.data?.message || error.message);
		}
	};

	return (
		<div className="flex flex-col gap-6 h-full">
			<h1 className="font-bold text-3xl text-foreground text-center">Pets</h1>

			{loading ? (
				<div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))]">
					<PetCardSkeleton />
					<PetCardSkeleton />
					<PetCardSkeleton />
				</div>
			) : pets.length > 0 ? (
				<div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))]">
					{pets.map((pet) => (
						<div
							key={pet._id}
							className="bg-white rounded-2xl p-4 flex flex-col items-center justify-between gap-4 cursor-pointer relative shadow-md border border-secondary/20 hover:scale-105 transition-transform duration-300"
							onClick={() => setPet(pet)}
						>
							<PetSprite pet={pet} height={100} />
							<p className="text-2xl font-bold text-foreground text-center">{pet.name}</p>
						</div>
					))}

					<AddPetButton onClick={handleAddPet} />
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center">
					<p className="text-secondary text-center text-lg mb-4">Click the button below to add a pet!</p>
					<AddPetButton onClick={handleAddPet} variant="centered" />
				</div>
			)}
		</div>
	);
}

export default PetsPage;
