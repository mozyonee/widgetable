import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { sample } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
	CLAIM_TYPE_CONFIG,
	ClaimType,
	EXPEDITION_CONFIG,
	getNextClaimTime,
	isClaimAvailable,
	ItemResult,
	ItemReward,
	ITEMS_CLAIM_CONFIG,
	ItemStatus,
	PET_ACTIONS_BY_CATEGORY,
	PetActionCategory,
	VALENTINE_GIFT_ITEMS,
} from '@widgetable/types';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ItemsService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
	) {}

	async getItemStatus(userId: Types.ObjectId): Promise<ItemStatus> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		const pets = await this.petModel.find({ parents: { $in: [userId] } });
		const petCount = pets.filter((pet) => !pet.isEgg).length;

		const now = new Date();
		const available = {} as Record<ClaimType, boolean>;
		const nextClaimTime: Partial<Record<ClaimType, Date>> = {};

		for (const type of Object.values(ClaimType)) {
			const { cooldownHours } = CLAIM_TYPE_CONFIG[type];
			const lastTime = user.lastClaimTimes?.get(type);
			const isAvailable = isClaimAvailable(lastTime, cooldownHours, now);
			available[type] = isAvailable;
			if (!isAvailable) nextClaimTime[type] = getNextClaimTime(lastTime!, cooldownHours);
		}

		return { available, nextClaimTime, petCount };
	}

	async executeClaim(userId: Types.ObjectId, claimType: ClaimType): Promise<ItemResult> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		const pets = await this.petModel.find({ parents: { $in: [userId] } });
		const petCount = pets.filter((pet) => !pet.isEgg).length;

		const now = new Date();
		const { cooldownHours, multiplier } = CLAIM_TYPE_CONFIG[claimType];
		const lastClaimTime = user.lastClaimTimes?.get(claimType);

		if (!isClaimAvailable(lastClaimTime, cooldownHours, now)) {
			throw new BadRequestException();
		}

		const result = this.calculateClaimItems(petCount, multiplier);

		await this.usersService.addInventoryBundle(userId, result.items);
		await this.userModel.findByIdAndUpdate(userId, { [`lastClaimTimes.${claimType}`]: now });

		return result;
	}

	calculateClaimItems(petCount: number, multiplier: number): ItemResult {
		const petMultiplier = Math.max(1, Math.sqrt(petCount));

		const foodCount = Math.floor(ITEMS_CLAIM_CONFIG.BASE_FOOD_ITEMS * petMultiplier * multiplier);
		const drinkCount = Math.floor(ITEMS_CLAIM_CONFIG.BASE_DRINK_ITEMS * petMultiplier * multiplier);
		const hygieneCount = Math.floor(ITEMS_CLAIM_CONFIG.BASE_HYGIENE_ITEMS * petMultiplier * multiplier);
		const careCount = Math.floor(ITEMS_CLAIM_CONFIG.BASE_CARE_ITEMS * petMultiplier * multiplier);

		const foodItems = this.selectRandomItems(PetActionCategory.FEED, foodCount);
		const drinkItems = this.selectRandomItems(PetActionCategory.DRINK, drinkCount);
		const hygieneItems = this.selectRandomItems(PetActionCategory.WASH, hygieneCount);
		const careItems = this.selectRandomItems(PetActionCategory.CARE, careCount);

		// Egg chance decreases as pet count grows
		const eggChance = Math.max(
			ITEMS_CLAIM_CONFIG.BASE_EGG_CHANCE / (1 + petCount * ITEMS_CLAIM_CONFIG.EGG_CHANCE_PET_DECAY),
			ITEMS_CLAIM_CONFIG.MIN_EGG_CHANCE,
		);
		const earnedEggs = Math.random() < eggChance ? 1 : 0;

		const isValentineSeason = this.configService.get<string>('VALENTINE_SEASON', '').toLowerCase() === 'true';
		const valentineItems = isValentineSeason
			? this.selectRandomValentineItems(Math.floor(2 * petMultiplier * multiplier))
			: [];

		const valentineCount = valentineItems.reduce((sum, item) => sum + item.quantity, 0);
		const totalItems = foodCount + drinkCount + hygieneCount + careCount + earnedEggs + valentineCount;

		return {
			success: true,
			items: {
				food: foodItems,
				drinks: drinkItems,
				hygiene: hygieneItems,
				care: careItems,
				eggs: earnedEggs,
				valentines: valentineItems.length > 0 ? valentineItems : undefined,
			},
			totalItems,
		};
	}

	calculateExpeditionItems(pet: PetDocument): ItemResult {
		const {
			BASE_FOOD_ITEMS,
			BASE_DRINK_ITEMS,
			BASE_HYGIENE_ITEMS,
			BASE_CARE_ITEMS,
			MIN_EGG_CHANCE,
			MAX_EGG_CHANCE,
			LEVEL_ITEM_RATE,
			LEVEL_ITEM_CAP,
			EGG_CHANCE_LEVEL_GROWTH,
		} = EXPEDITION_CONFIG;
		// Caps bonus at +100% to prevent extreme scaling at high levels
		const levelMultiplier = 1 + Math.min(pet.level * LEVEL_ITEM_RATE, LEVEL_ITEM_CAP);

		const foodCount = Math.floor(BASE_FOOD_ITEMS * levelMultiplier);
		const drinkCount = Math.floor(BASE_DRINK_ITEMS * levelMultiplier);
		const hygieneCount = Math.floor(BASE_HYGIENE_ITEMS * levelMultiplier);
		const careCount = Math.floor(BASE_CARE_ITEMS * levelMultiplier);

		const foodItems = this.selectRandomItems(PetActionCategory.FEED, foodCount);
		const drinkItems = this.selectRandomItems(PetActionCategory.DRINK, drinkCount);
		const hygieneItems = this.selectRandomItems(PetActionCategory.WASH, hygieneCount);
		const careItems = this.selectRandomItems(PetActionCategory.CARE, careCount);

		// Logarithmic growth from MIN to MAX based on level
		const eggChance = Math.min(
			MIN_EGG_CHANCE + (MAX_EGG_CHANCE - MIN_EGG_CHANCE) * (1 - 1 / (1 + pet.level * EGG_CHANCE_LEVEL_GROWTH)),
			MAX_EGG_CHANCE,
		);
		const earnedEggs = Math.random() < eggChance ? 1 : 0;

		// February-only valentine items
		const isValentineSeason = this.configService.get<string>('VALENTINE_SEASON', '').toLowerCase() === 'true';
		const valentineItems = isValentineSeason
			? this.selectRandomValentineItems(Math.floor(1 * levelMultiplier))
			: [];

		const valentineCount = valentineItems.reduce((sum, item) => sum + item.quantity, 0);

		return {
			success: true,
			items: {
				food: foodItems,
				drinks: drinkItems,
				hygiene: hygieneItems,
				care: careItems,
				eggs: earnedEggs,
				valentines: valentineItems.length > 0 ? valentineItems : undefined,
			},
			totalItems: foodCount + drinkCount + hygieneCount + careCount + earnedEggs + valentineCount,
		};
	}

	selectRandomItems(category: PetActionCategory, count: number): ItemReward[] {
		const actions = PET_ACTIONS_BY_CATEGORY[category].filter((a) => a.inventoryCost !== undefined);
		const itemCounts = new Map<string, number>();

		for (let i = 0; i < count; i++) {
			const selected = sample(actions)!;
			itemCounts.set(selected.name, (itemCounts.get(selected.name) || 0) + 1);
		}

		const result: ItemReward[] = [];
		itemCounts.forEach((quantity, name) => {
			result.push({ name, quantity });
		});

		return result;
	}

	selectRandomValentineItems(count: number): ItemReward[] {
		const itemCounts = new Map<string, number>();

		for (let i = 0; i < count; i++) {
			const selected = sample(VALENTINE_GIFT_ITEMS)!;
			itemCounts.set(selected.name, (itemCounts.get(selected.name) || 0) + 1);
		}

		const result: ItemReward[] = [];
		itemCounts.forEach((quantity, name) => {
			result.push({ name, quantity });
		});

		return result;
	}
}
