import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PetType } from '@widgetable/types';
import { clamp, random } from 'lodash';
import { Model, Types } from 'mongoose';
import { UserDocument } from 'src/users/entities/user.entity';
import { Pet, PetDocument } from './entities/pet.entity';

@Injectable()
export class PetsService {
	constructor(@InjectModel(Pet.name) private petModel: Model<PetDocument>) {}

	async getPet(petId: PetDocument['_id']) {
		const pet = await this.petModel.findById(petId).populate('parents', '_id name email picture');
		if (!pet) throw new NotFoundException();

		return await this.calculateCurrentStats(pet);
	}

	async getPetsForUser(userId: UserDocument['_id']) {
		const pets = await this.petModel
			.find({
				parents: { $in: [userId] },
			})
			.populate('parents', '_id name email picture');

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
		const populatedPet = await this.petModel.findById(result._id).populate('parents', '_id name email picture');
		if (!populatedPet) throw new NotFoundException();
		return await this.calculateCurrentStats(populatedPet);
	}

	async update(id: PetDocument['_id'], updateData: Partial<Pet>) {
		const newData: any = {
			...updateData,
			parents: updateData.parents?.map((p) => new Types.ObjectId(p)),
		};

		// Clamp needs values to valid range [0, 100]
		if (updateData.needs) {
			newData.needs = {};
			(['hunger', 'thirst', 'hygiene', 'energy', 'toilet'] as const).forEach((key) => {
				if (updateData.needs?.[key] !== undefined) {
					newData.needs[key] = clamp(updateData.needs[key], 0, 100);
				}
			});
		}

		const pet = await this.petModel
			.findByIdAndUpdate(id, newData, { new: true })
			.populate('parents', '_id name email picture');

		if (!pet) throw new NotFoundException();
		return await this.calculateCurrentStats(pet);
	}

	async remove(id: PetDocument['_id']) {
		const result = await this.petModel.findByIdAndDelete(id);
		if (!result) throw new NotFoundException();
		return result;
	}

	private async calculateCurrentStats(pet: PetDocument) {
		const now = Date.now();
		const timeDiff = now - (pet.updatedAt?.getTime() || 0);
		const intervals = Math.floor(timeDiff / 5000); // 5 second intervals

		if (intervals <= 0) return pet;

		// Decrease needs (adjust rates as needed)
		const hungerDecrease = intervals * 10;
		const thirstDecrease = intervals * 10.2;
		const energyDecrease = intervals * 10.5;
		const hygieneDecrease = intervals * 10.3;
		const toiletDecrease = intervals * 10.2;

		const updatedNeeds = {
			hunger: clamp(pet.needs.hunger - hungerDecrease, 0, 100),
			thirst: clamp(pet.needs.thirst - thirstDecrease, 0, 100),
			energy: clamp(pet.needs.energy - energyDecrease, 0, 100),
			hygiene: clamp(pet.needs.hygiene - hygieneDecrease, 0, 100),
			toilet: clamp(pet.needs.toilet - toiletDecrease, 0, 100),
		};

		const updatedPet = await this.petModel
			.findByIdAndUpdate(pet._id, { needs: updatedNeeds }, { new: true })
			.populate('parents', '_id name email picture');

		return updatedPet;
	}
}
