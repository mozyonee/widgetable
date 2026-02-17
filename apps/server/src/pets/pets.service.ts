import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

import {
	calculateLevel,
	ClaimResult,
	DEFAULT_LANGUAGE,
	EXPEDITION_BASE_DURATION,
	EXPEDITION_LEVEL_MULTIPLIER,
	HATCH_DURATIONS,
	PET_NEED_KEYS,
	PET_NEEDS_CONFIG,
	PET_THRESHOLDS,
	PET_UPDATE_INTERVAL,
	PetActionCategory,
	PetType,
	PetUpdate,
} from '@widgetable/types';
import { locales } from '@widgetable/i18n';
import { clamp, random } from 'lodash';
import { Connection, Model, Types } from 'mongoose';
import { BaseService } from 'src/common/base.service';
import { PET_CONFIG } from 'src/shared/constants';
import { RewardsService } from 'src/shared/rewards.service';
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
		private readonly rewardsService: RewardsService,
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
		const translationKey = `pets.type.${randomType}`;
		const petName = locales[lang]?.[translationKey] || locales[DEFAULT_LANGUAGE]?.[translationKey] || randomType;

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

		const timeDiff = Date.now() - (pet.updatedAt?.getTime() || 0);
		const intervals = Math.floor(timeDiff / PET_UPDATE_INTERVAL);

		if (intervals <= 0) return pet;
		// Convert per-minute decay to per-interval rate
		const DECAY_TIME_UNIT = 60 * 1000;
		const updatedNeeds: Record<string, number> = {};

		PET_NEED_KEYS.forEach((key) => {
			const config = PET_NEEDS_CONFIG[key];
			const decrease = intervals * config.decayRate * (PET_UPDATE_INTERVAL / DECAY_TIME_UNIT);
			updatedNeeds[key] = clamp(pet.needs[key] - decrease, 0, 100);
		});

		// Allows the next neglect cycle to trigger a fresh notification
		const anyNeedRestored = PET_NEED_KEYS.some(
			(key) => pet.needs[key] < PET_THRESHOLDS.URGENT && updatedNeeds[key] >= PET_THRESHOLDS.URGENT,
		);

		const updatedPet = await this.petModel
			.findByIdAndUpdate(pet._id, { needs: updatedNeeds, ...(anyNeedRestored && { urgentNotifiedAt: null }) }, { new: true })
			.populate('parents', this.PARENT_FIELDS);

		return updatedPet || pet;
	}

	async startExpedition(petId: PetDocument['_id'], userId: UserDocument['_id']): Promise<PetDocument> {
		const pet = await this.getPet(petId);
		// Distinct status codes allow frontend to map errors to i18n keys
		if (pet.isEgg) throw new UnprocessableEntityException();
		if (pet.isOnExpedition) throw new ConflictException();

		if (pet.needs) {
			const urgentNeeds: string[] = [];
			if (pet.needs.hunger < PET_THRESHOLDS.URGENT) urgentNeeds.push('hunger');
			if (pet.needs.thirst < PET_THRESHOLDS.URGENT) urgentNeeds.push('thirst');
			if (pet.needs.hygiene < PET_THRESHOLDS.URGENT) urgentNeeds.push('hygiene');
			if (pet.needs.energy < PET_THRESHOLDS.URGENT) urgentNeeds.push('energy');
			if (pet.needs.toilet < PET_THRESHOLDS.URGENT) urgentNeeds.push('toilet');

			if (urgentNeeds.length > 0) throw new BadRequestException();
		}
		// Only count pets still away, not returned but unclaimed
		const now = new Date();
		const allPets = await this.getPetsForUser(userId);
		const activePets = allPets.filter((p) => !p.isEgg);
		const maxSlots = Math.ceil(activePets.length * PET_CONFIG.MAX_EXPEDITION_SLOTS_RATIO);
		const usedSlots = allPets.filter(
			(p) => p.isOnExpedition && p.expeditionReturnTime && new Date(p.expeditionReturnTime) > now,
		).length;

		if (usedSlots >= maxSlots) throw new ConflictException();

		const baseDuration = EXPEDITION_BASE_DURATION;
		const levelMultiplier = 1 + pet.level * EXPEDITION_LEVEL_MULTIPLIER;
		const duration = baseDuration * levelMultiplier;
		const returnTime = new Date(Date.now() + duration);

		const rewards = this.calculateExpeditionRewards(pet);

		const updatedPet = await this.petModel
			.findByIdAndUpdate(
				petId,
				{
					isOnExpedition: true,
					expeditionReturnTime: returnTime,
					expeditionRewards: rewards.rewards,
				},
				{ new: true },
			)
			.populate('parents', this.PARENT_FIELDS);

		if (!updatedPet) throw new NotFoundException();
		return updatedPet;
	}

	async claimExpedition(petId: PetDocument['_id'], userId: UserDocument['_id']): Promise<ClaimResult> {
		const pet = await this.getPet(petId);

		if (!pet.isOnExpedition) throw new ConflictException();
		if (!pet.expeditionReturnTime) throw new UnprocessableEntityException();
		if (new Date() < pet.expeditionReturnTime) {
			throw new ConflictException();
		}
		if (!pet.expeditionRewards) throw new UnprocessableEntityException();
		// Atomic transaction ensures rewards and state update together
		const rewards = pet.expeditionRewards;
		await this.withTransaction(async (session) => {
			await this.usersService.applyRewards(userId, rewards, session);

			await this.petModel.findByIdAndUpdate(
				petId,
				{
					isOnExpedition: false,
					expeditionReturnTime: undefined,
					expeditionRewards: undefined,
				},
				{ session },
			);
		});

		const valentineCount = (rewards.valentines || []).reduce((sum, item) => sum + item.quantity, 0);
		const totalItems =
			[...rewards.food, ...rewards.drinks, ...rewards.hygiene, ...(rewards.care || [])].reduce(
				(sum, item) => sum + item.quantity,
				rewards.eggs,
			) + valentineCount;

		return {
			success: true,
			rewards,
			totalItems,
			nextClaimTime: new Date(),
		};
	}

	private calculateExpeditionRewards(pet: PetDocument): ClaimResult {
		const BASE_FOOD_ITEMS = 4;
		const BASE_DRINK_ITEMS = 4;
		const BASE_HYGIENE_ITEMS = 3;
		const BASE_CARE_ITEMS = 3;
		const MIN_EGG_CHANCE = 0.05;
		const MAX_EGG_CHANCE = 0.18;
		// Exponential scaling caps at +100%
		const levelMultiplier = 1 + Math.min(pet.level * 0.1, 1.0);

		const foodCount = Math.floor(BASE_FOOD_ITEMS * levelMultiplier);
		const drinkCount = Math.floor(BASE_DRINK_ITEMS * levelMultiplier);
		const hygieneCount = Math.floor(BASE_HYGIENE_ITEMS * levelMultiplier);
		const careCount = Math.floor(BASE_CARE_ITEMS * levelMultiplier);

		const foodItems = this.rewardsService.selectRandomItems(PetActionCategory.FEED, foodCount);
		const drinkItems = this.rewardsService.selectRandomItems(PetActionCategory.DRINK, drinkCount);
		const hygieneItems = this.rewardsService.selectRandomItems(PetActionCategory.WASH, hygieneCount);
		const careItems = this.rewardsService.selectRandomItems(PetActionCategory.CARE, careCount);
		// Logarithmic growth from 5% to 18% based on level
		const eggChance = Math.min(
			MIN_EGG_CHANCE + (MAX_EGG_CHANCE - MIN_EGG_CHANCE) * (1 - 1 / (1 + pet.level * 0.3)),
			MAX_EGG_CHANCE,
		);
		const earnedEggs = Math.random() < eggChance ? 1 : 0;
		// February-only valentine items
		const valentineItems = this.rewardsService.isValentineSeason()
			? this.rewardsService.selectRandomValentineItems(Math.floor(1 * levelMultiplier))
			: [];

		const valentineCount = valentineItems.reduce((sum, item) => sum + item.quantity, 0);

		return {
			success: true,
			rewards: {
				food: foodItems,
				drinks: drinkItems,
				hygiene: hygieneItems,
				care: careItems,
				eggs: earnedEggs,
				valentines: valentineItems.length > 0 ? valentineItems : undefined,
			},
			totalItems: foodCount + drinkCount + hygieneCount + careCount + earnedEggs + valentineCount,
			nextClaimTime: new Date(),
		};
	}
}
