import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	calculateLevel,
	EGG_ITEM_NAME,
	EXPEDITION_BASE_DURATION,
	EXPEDITION_LEVEL_MULTIPLIER,
	ItemReward,
	ItemTier,
	PET_ACTIONS_BY_CATEGORY,
	PET_NEED_KEYS,
	PET_NEEDS_CONFIG,
	PET_UPDATE_INTERVAL,
	PetAction,
	PetActionCategory,
	PetType,
} from '@widgetable/types';
import { clamp, random } from 'lodash';
import { Model, Types } from 'mongoose';
import { ClaimResult } from 'src/claims/interfaces/claim.interface';
import { UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { Pet, PetDocument } from './entities/pet.entity';

@Injectable()
export class PetsService {
	private readonly PARENT_FIELDS = '_id name email picture';

	// Tier weights for reward generation (must sum to 100)
	private readonly TIER_WEIGHTS = {
		[ItemTier.BASIC]: 60,
		[ItemTier.COMMON]: 25,
		[ItemTier.PREMIUM]: 10,
		[ItemTier.LEGENDARY]: 5,
	};

	constructor(
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		private readonly usersService: UsersService,
	) {}

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

		const existingPets = await this.petModel.countDocuments({ parents: { $in: [userId] }, isEgg: false });
		const HATCH_DURATIONS = [
			30 * 1000,			// 0 pets: 30s
			5 * 60 * 1000,		// 1 pet: 5 min
			30 * 60 * 1000,		// 2 pets: 30 min
			60 * 60 * 1000,		// 3 pets: 1 hour
			2 * 60 * 60 * 1000,	// 4 pets: 2 hours
			4 * 60 * 60 * 1000,	// 5 pets: 4 hours
			8 * 60 * 60 * 1000,	// 6 pets: 8 hours
			16 * 60 * 60 * 1000,	// 7+ pets: 16 hours (cap)
		];
		const hatchDuration = HATCH_DURATIONS[Math.min(existingPets, HATCH_DURATIONS.length - 1)];

		const result = await this.petModel.create({
			type: randomType,
			name: randomType, // Will be named by the type initially
			parents: [userId],
			isEgg: true,
			hatchTime: new Date(Date.now() + hatchDuration),
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

	// ============================================================================
	// EXPEDITION METHODS
	// ============================================================================

	async startExpedition(petId: PetDocument['_id'], userId: UserDocument['_id']): Promise<PetDocument> {
		const pet = await this.getPet(petId);

		// Validations
		if (pet.isEgg) throw new BadRequestException();
		if (pet.isOnExpedition) throw new BadRequestException();

		// Check for urgent needs (any need below 30)
		if (pet.needs) {
			const urgentNeeds: string[] = [];
			if (pet.needs.hunger < 30) urgentNeeds.push('hunger');
			if (pet.needs.thirst < 30) urgentNeeds.push('thirst');
			if (pet.needs.hygiene < 30) urgentNeeds.push('hygiene');
			if (pet.needs.energy < 30) urgentNeeds.push('energy');
			if (pet.needs.toilet < 30) urgentNeeds.push('toilet');

			if (urgentNeeds.length > 0) throw new BadRequestException();
		}

		// Check expedition slots
		const allPets = await this.getPetsForUser(userId);
		const activePets = allPets.filter((p) => !p.isEgg);
		const maxSlots = Math.ceil(activePets.length * 0.3);
		const usedSlots = allPets.filter((p) => p.isOnExpedition).length;

		if (usedSlots >= maxSlots) throw new BadRequestException();


		// Calculate duration (1 hour + 10% per level)
		const baseDuration = EXPEDITION_BASE_DURATION;
		const levelMultiplier = 1 + pet.level * EXPEDITION_LEVEL_MULTIPLIER;
		const duration = baseDuration * levelMultiplier;
		const returnTime = new Date(Date.now() + duration);

		// Generate rewards
		const rewards = this.calculateExpeditionRewards(pet);

		// Update pet
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

		// Validations
		if (!pet.isOnExpedition) throw new BadRequestException();
		if (!pet.expeditionReturnTime) throw new BadRequestException();
		if (new Date() < pet.expeditionReturnTime) {
			throw new BadRequestException();
		}
		if (!pet.expeditionRewards) throw new BadRequestException();

		// Transfer rewards to user inventory
		const rewards = pet.expeditionRewards;
		for (const item of rewards.food) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		for (const item of rewards.drinks) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		for (const item of rewards.hygiene) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		for (const item of rewards.care || []) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		if (rewards.eggs > 0) {
			await this.usersService.addInventory(userId.toString(), EGG_ITEM_NAME, rewards.eggs);
		}

		// Clear expedition state
		await this.petModel.findByIdAndUpdate(petId, {
			isOnExpedition: false,
			expeditionReturnTime: undefined,
			expeditionRewards: undefined,
		});

		// Return ClaimResult format (compatible with RewardsModal)
		const totalItems = [...rewards.food, ...rewards.drinks, ...rewards.hygiene, ...(rewards.care || [])].reduce((sum, item) => sum + item.quantity, rewards.eggs);

		return {
			success: true,
			rewards,
			totalItems,
			nextClaimTime: new Date(), // Can restart immediately
		};
	}

	private calculateExpeditionRewards(pet: PetDocument): ClaimResult {
		// Base rewards for single pet (slightly less than global system)
		const BASE_FOOD_ITEMS = 6;
		const BASE_DRINK_ITEMS = 4;
		const BASE_HYGIENE_ITEMS = 3;
		const BASE_CARE_ITEMS = 2;
		const MIN_EGG_CHANCE = 0.05;
		const MAX_EGG_CHANCE = 0.18;

		// Level scaling (+10% per level, capped at +100%)
		const levelMultiplier = 1 + Math.min(pet.level * 0.1, 1.0);

		const foodCount = Math.floor(BASE_FOOD_ITEMS * levelMultiplier);
		const drinkCount = Math.floor(BASE_DRINK_ITEMS * levelMultiplier);
		const hygieneCount = Math.floor(BASE_HYGIENE_ITEMS * levelMultiplier);
		const careCount = Math.floor(BASE_CARE_ITEMS * levelMultiplier);

		const foodItems = this.selectRandomItems(PetActionCategory.FEED, foodCount);
		const drinkItems = this.selectRandomItems(PetActionCategory.DRINK, drinkCount);
		const hygieneItems = this.selectRandomItems(PetActionCategory.WASH, hygieneCount);
		const careItems = this.selectRandomItems(PetActionCategory.CARE, careCount);

		// Egg chance (increases with level: 5% → 18%)
		const eggChance = Math.min(MIN_EGG_CHANCE + (MAX_EGG_CHANCE - MIN_EGG_CHANCE) * (1 - 1 / (1 + pet.level * 0.3)), MAX_EGG_CHANCE);
		const earnedEggs = Math.random() < eggChance ? 1 : 0;

		return {
			success: true,
			rewards: { food: foodItems, drinks: drinkItems, hygiene: hygieneItems, care: careItems, eggs: earnedEggs },
			totalItems: foodCount + drinkCount + hygieneCount + careCount + earnedEggs,
			nextClaimTime: new Date(),
		};
	}

	private selectRandomItems(category: PetActionCategory, count: number): ItemReward[] {
		const actions = PET_ACTIONS_BY_CATEGORY[category].filter((a) => a.inventoryCost !== undefined);
		const itemCounts = new Map<string, number>();

		// Group items by tier
		const itemsByTier = new Map<ItemTier, PetAction[]>();
		actions.forEach((action) => {
			const tier = (action.inventoryCost || 1) as ItemTier;
			if (!itemsByTier.has(tier)) itemsByTier.set(tier, []);
			itemsByTier.get(tier)!.push(action);
		});

		// Select items with weighted randomness
		for (let i = 0; i < count; i++) {
			const tier = this.selectWeightedTier();
			const tierItems = itemsByTier.get(tier) || [];
			if (tierItems.length === 0) continue;

			// Pick random item from tier, avoiding too many duplicates
			const availableItems = tierItems.filter((item) => (itemCounts.get(item.name) || 0) < 2);
			const selectedItem =
				availableItems.length > 0
					? availableItems[Math.floor(Math.random() * availableItems.length)]
					: tierItems[Math.floor(Math.random() * tierItems.length)];

			itemCounts.set(selectedItem.name, (itemCounts.get(selectedItem.name) || 0) + 1);
		}

		// Convert to ItemReward format
		const result: ItemReward[] = [];
		itemCounts.forEach((quantity, name) => {
			const action = actions.find((a) => a.name === name)!;
			result.push({ name, quantity, tier: (action.inventoryCost || 1) as ItemTier });
		});

		return result;
	}

	private selectWeightedTier(): ItemTier {
		const rand = Math.random() * 100;
		if (rand < this.TIER_WEIGHTS[ItemTier.BASIC]) return ItemTier.BASIC;
		if (rand < this.TIER_WEIGHTS[ItemTier.BASIC] + this.TIER_WEIGHTS[ItemTier.COMMON]) return ItemTier.COMMON;
		if (rand < this.TIER_WEIGHTS[ItemTier.BASIC] + this.TIER_WEIGHTS[ItemTier.COMMON] + this.TIER_WEIGHTS[ItemTier.PREMIUM])
			return ItemTier.PREMIUM;
		return ItemTier.LEGENDARY;
	}
}
