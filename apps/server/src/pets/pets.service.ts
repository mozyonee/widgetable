import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { random } from 'lodash';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument, PetType } from './entities/pet.entity';
import { UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class PetsService {
	constructor(@InjectModel(Pet.name) private petModel: Model<PetDocument>) {}

	async getPet(petId: PetDocument['_id']) {
		const pet = await this.petModel.findById(petId);
		if (!pet) throw new NotFoundException('Not found');

		return await this.calculateCurrentStats(pet);
	}

	async getPetsForUser(userId: UserDocument['_id']) {
		const pets = await this.petModel.find({
			parents: { $in: [userId] },
		});

		if (!pets.length) return [];

		const updatedPets = await Promise.all(
			pets.map(async (pet) => {
				return await this.calculateCurrentStats(pet);
			}),
		);

		return updatedPets;
	}

	async create(userId: UserDocument['_id']) {
		const pets = Object.values(PetType);

		const pet = {
			type: pets[random(pets.length - 1)],
			name: pets[random(pets.length - 1)],
			parents: [userId],
		};

		const result = await this.petModel.create(pet);
		return result;
	}

	async update(id: PetDocument['_id'], updateData: Partial<Pet>) {
		const newData = {
			...updateData,
			parents: updateData.parents?.map((p) => new Types.ObjectId(p)),
		};

		const pet = await this.petModel.findByIdAndUpdate(id, newData, { new: true });

		if (!pet) throw new NotFoundException('Pet not found');
		return pet;
	}

	async remove(id: PetDocument['_id']) {
		const result = await this.petModel.findByIdAndDelete(id);
		if (!result) throw new NotFoundException('Pet not found');
		return result;
	}

	private async calculateCurrentStats(pet: PetDocument) {
		const now = Date.now();
		const timeDiff = now - (pet.updatedAt?.getTime() || 0); // Use updatedAt instead of lastUpdated
		const intervals = Math.floor(timeDiff / 5000); // 5 second intervals

		if (intervals <= 0) return pet;

		// Decrease stats (adjust rates as needed)
		const hungerDecrease = intervals * 10; // Lose 1 hunger per 5 seconds
		const thirstDecrease = intervals * 10.2; // Lose 1.2 thirst per 5 seconds
		const energyDecrease = intervals * 10.5; // Lose 0.5 energy per 5 seconds
		const hygieneDecrease = intervals * 10.3; // Lose 0.3 hygiene per 5 seconds
		const toiletDecrease = intervals * 10.2; // Lose 1.2 toilet per 5 seconds

		pet.hunger = Math.max(0, pet.hunger - hungerDecrease);
		pet.thirst = Math.max(0, pet.thirst - thirstDecrease);
		pet.energy = Math.max(0, pet.energy - energyDecrease);
		pet.hygiene = Math.max(0, pet.hygiene - hygieneDecrease);
		pet.toilet = Math.max(0, pet.toilet - toiletDecrease);

		const updatedPet = await this.petModel.findOneAndUpdate(pet._id, pet, { new: true });

		return updatedPet;
	}
}
