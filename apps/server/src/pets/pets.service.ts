import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

import {
	calculateDecayedNeeds,
	calculateLevel,
	DEFAULT_LANGUAGE,
	EXPEDITION_BASE_DURATION,
	EXPEDITION_LEVEL_MULTIPLIER,
	HATCH_DURATIONS,
	ItemResult,
	MAX_EXPEDITION_SLOTS_RATIO,
	PET_NEED_KEYS,
	PET_THRESHOLDS,
	PET_UPDATE_INTERVAL,
	PetType,
	PetUpdate,
} from '@widgetable/types';
import { translate } from '@widgetable/i18n';
import { clamp, random } from 'lodash';
import { Connection, Model, Types } from 'mongoose';
import { BaseService } from 'src/common/base.service';
import { ItemsService } from 'src/items/items.service';
import { UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Pet, PetDocument } from './entities/pet.entity';

@Injectable()
export class PetsService extends BaseService {
	private readonly PARENT_FIELDS = '_id name email picture';

	constructor(
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		@InjectConnection() connection: Connection,
		private readonly usersService: UsersService,
		private readonly itemsService: ItemsService,
	) {
		super(connection);
	}

	async getPet(petId: PetDocument['_id']) {
		const pet = await this.petModel.findById(petId).populate('parents', this.PARENT_FIELDS);
		if (!pet) throw new NotFoundException();
		return this.processPet(pet);
	}

	async getPetsForUser(userId: UserDocument['_id']) {
		const pets = await this.petModel.find({ parents: { $in: [userId] } }).populate('parents', this.PARENT_FIELDS);

		if (!pets.length) return [];

		return Promise.all(pets.map((pet) => this.processPet(pet)));
	}

	async create(userId: UserDocument['_id']) {
		const pets = Object.values(PetType);
		const randomType = pets[random(pets.length - 1)];

		const user = await this.usersService.findById(userId);
		const lang = user?.language || DEFAULT_LANGUAGE;
		const petName = translate(lang, `pets.type.${randomType}`);

		const existingPets = await this.petModel.countDocuments({ parents: { $in: [userId] }, isEgg: false });
		const hatchDuration = HATCH_DURATIONS[Math.min(existingPets, HATCH_DURATIONS.length - 1)];

		const result = await this.petModel.create({
			type: randomType,
			name: petName,
			parents: [userId],
			isEgg: true,
			hatchTime: new Date(Date.now() + hatchDuration),
		});

		const populatedPet = await this.petModel.findById(result._id).populate('parents', this.PARENT_FIELDS);
		if (!populatedPet) throw new NotFoundException();
		return populatedPet;
	}

	async update(id: PetDocument['_id'], updateData: PetUpdate, experienceGain?: number) {
		const newData: Record<string, unknown> = {
			...updateData,
			parents: updateData.parents?.map((p) => new Types.ObjectId(p)),
		};
		// Dot notation merges needs instead of replacing entire object
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

		const pet = await this.petModel
			.findByIdAndUpdate(id, newData, { new: true })
			.populate('parents', this.PARENT_FIELDS);

		if (!pet) throw new NotFoundException();
		return this.processPet(pet);
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
		if (pet.isEgg && pet.hatchTime && new Date() >= pet.hatchTime) {
			const hatchedPet = await this.petModel
				.findByIdAndUpdate(pet._id, { isEgg: false, hatchTime: undefined }, { new: true })
				.populate('parents', this.PARENT_FIELDS);

			pet = hatchedPet || pet;
		}

		if (pet.isEgg) return pet;

		const now = new Date();
		const lastUpdatedAt = pet.needsUpdatedAt ?? pet.updatedAt ?? now;
		const { needs: updatedNeeds, changed, intervals } = calculateDecayedNeeds(pet.needs, lastUpdatedAt, now);

		if (!changed) return pet;

		// Snap to the last completed interval boundary so the remainder carries over to the next run
		const snappedUpdatedAt = new Date(lastUpdatedAt.getTime() + intervals * PET_UPDATE_INTERVAL);

		const updatedPet = await this.petModel
			.findByIdAndUpdate(pet._id, { needs: updatedNeeds, needsUpdatedAt: snappedUpdatedAt }, { new: true })
			.populate('parents', this.PARENT_FIELDS);

		return updatedPet || pet;
	}

	async startExpedition(petId: PetDocument['_id'], userId: UserDocument['_id']): Promise<PetDocument> {
		const pet = await this.getPet(petId);
		// Distinct status codes allow frontend to map errors to i18n keys
		if (pet.isEgg) throw new UnprocessableEntityException();
		if (pet.isOnExpedition) throw new ConflictException();

		if (pet.needs && PET_NEED_KEYS.some((key) => pet.needs[key] < PET_THRESHOLDS.URGENT)) {
			throw new BadRequestException();
		}

		// Only count pets still away, not returned but unclaimed
		const now = new Date();
		const allPets = await this.getPetsForUser(userId);
		const activePets = allPets.filter((p) => !p.isEgg);
		const maxSlots = Math.ceil(activePets.length * MAX_EXPEDITION_SLOTS_RATIO);
		const usedSlots = allPets.filter(
			(p) => p.isOnExpedition && p.expeditionReturnTime && new Date(p.expeditionReturnTime) > now,
		).length;

		if (usedSlots >= maxSlots) throw new ConflictException();

		const baseDuration = EXPEDITION_BASE_DURATION;
		const levelMultiplier = 1 + pet.level * EXPEDITION_LEVEL_MULTIPLIER;
		const duration = baseDuration * levelMultiplier;
		const returnTime = new Date(Date.now() + duration);

		const updatedPet = await this.petModel
			.findByIdAndUpdate(
				petId,
				{
					isOnExpedition: true,
					expeditionReturnTime: returnTime,
				},
				{ new: true },
			)
			.populate('parents', this.PARENT_FIELDS);

		if (!updatedPet) throw new NotFoundException();
		return updatedPet;
	}

	async claimExpedition(petId: PetDocument['_id'], userId: UserDocument['_id']): Promise<ItemResult> {
		const pet = await this.getPet(petId);

		if (!pet.isOnExpedition) throw new ConflictException();
		if (!pet.expeditionReturnTime) throw new UnprocessableEntityException();
		if (new Date() < pet.expeditionReturnTime) throw new ConflictException();

		const result = this.itemsService.calculateExpeditionItems(pet);

		// Atomic transaction ensures items and state update together
		await this.withTransaction(async (session) => {
			await this.usersService.addInventoryBundle(userId, result.items, session);

			await this.petModel.findByIdAndUpdate(
				petId,
				{
					isOnExpedition: false,
					expeditionReturnTime: undefined,
				},
				{ session },
			);
		});

		return result;
	}
}
