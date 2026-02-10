import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { calculateLevel, HATCH_DURATION, PET_NEED_KEYS, PET_NEEDS_CONFIG, PET_UPDATE_INTERVAL, PetType } from '@widgetable/types';
import { clamp, random } from 'lodash';
import { Model, Types } from 'mongoose';
import { UserDocument } from 'src/users/entities/user.entity';
import { Pet, PetDocument } from './entities/pet.entity';

@Injectable()
export class PetsService {
	private readonly PARENT_FIELDS = '_id name email picture';

	constructor(@InjectModel(Pet.name) private petModel: Model<PetDocument>) {}

	async getPet(petId: PetDocument['_id']) {
		const pet = await this.petModel.findById(petId).populate('parents', this.PARENT_FIELDS);
		if (!pet) throw new NotFoundException();
		return await this.processPet(pet);
	}

	async getPetsForUser(userId: UserDocument['_id']) {
		const pets = await this.petModel.find({ parents: { $in: [userId] } }).populate('parents', this.PARENT_FIELDS);

		if (!pets.length) return [];

		return await Promise.all(pets.map((pet) => this.processPet(pet)));
	}

	async create(userId: UserDocument['_id']) {
		const pets = Object.values(PetType);
		const randomType = pets[random(pets.length - 1)];

		const result = await this.petModel.create({
			type: randomType,
			name: randomType, // Will be named by the type initially
			parents: [userId],
			isEgg: true,
			hatchTime: new Date(Date.now() + HATCH_DURATION),
		});

		const populatedPet = await this.petModel.findById(result._id).populate('parents', this.PARENT_FIELDS);
		if (!populatedPet) throw new NotFoundException();
		return populatedPet;
	}

	async update(id: PetDocument['_id'], updateData: Partial<Pet>, experienceGain?: number) {
		const newData: any = {
			...updateData,
			parents: updateData.parents?.map((p) => new Types.ObjectId(p)),
		};

		// Use dot notation for needs to merge instead of replace
		if (updateData.needs) {
			delete newData.needs;
			PET_NEED_KEYS.forEach((key) => {
				if (updateData.needs?.[key] !== undefined) {
					newData[`needs.${key}`] = clamp(updateData.needs[key], 0, 100);
				}
			});
		}

		if (experienceGain) {
			const currentPet = await this.petModel.findById(id);
			if (currentPet && !currentPet.isEgg) {
				const newExperience = currentPet.experience + experienceGain;
				const newLevel = calculateLevel(newExperience);
				newData.experience = newExperience;
				newData.level = newLevel;
			}
		}

		const pet = await this.petModel.findByIdAndUpdate(id, newData, { new: true }).populate('parents', this.PARENT_FIELDS);

		if (!pet) throw new NotFoundException();
		return await this.processPet(pet);
	}

	async remove(id: PetDocument['_id'], userId: UserDocument['_id']) {
		const pet = await this.petModel.findById(id);
		if (!pet) throw new NotFoundException();

		// If pet has multiple parents, just remove the user from parents array
		if (pet.parents.length > 1) {
			const updatedPet = await this.petModel
				.findByIdAndUpdate(id, { $pull: { parents: userId } }, { new: true })
				.populate('parents', this.PARENT_FIELDS);

			if (!updatedPet) throw new NotFoundException();
			return updatedPet;
		}

		// If pet has only one parent, delete the pet
		const result = await this.petModel.findByIdAndDelete(id);
		if (!result) throw new NotFoundException();
		return result;
	}

	private async processPet(pet: PetDocument): Promise<PetDocument> {
		// Check if egg should hatch
		if (pet.isEgg && pet.hatchTime && new Date() >= pet.hatchTime) {
			const hatchedPet = await this.petModel
				.findByIdAndUpdate(pet._id, { isEgg: false, hatchTime: undefined }, { new: true })
				.populate('parents', this.PARENT_FIELDS);

			pet = hatchedPet || pet;
		}

		if (pet.isEgg) return pet;

		// Calculate stat decay
		const timeDiff = Date.now() - (pet.updatedAt?.getTime() || 0);
		const intervals = Math.floor(timeDiff / PET_UPDATE_INTERVAL);

		if (intervals <= 0) return pet;

		// Decay rates are per DECAY_TIME_UNIT, so convert to per-interval rate
		const DECAY_TIME_UNIT = 60 * 1000;
		const updatedNeeds = {} as any;

		PET_NEED_KEYS.forEach((key) => {
			const config = PET_NEEDS_CONFIG[key];
			const decrease = intervals * config.decayRate * (PET_UPDATE_INTERVAL / DECAY_TIME_UNIT);
			updatedNeeds[key] = clamp(pet.needs[key] - decrease, 0, 100);
		});

		const updatedPet = await this.petModel
			.findByIdAndUpdate(pet._id, { needs: updatedNeeds }, { new: true })
			.populate('parents', this.PARENT_FIELDS);

		return updatedPet || pet;
	}
}
