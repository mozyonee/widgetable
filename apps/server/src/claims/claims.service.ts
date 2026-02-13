import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EGG_ITEM_NAME, ItemReward, ItemTier, PET_ACTIONS_BY_CATEGORY, PetAction, PetActionCategory, VALENTINE_GIFT_ITEMS } from '@widgetable/types';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ClaimResult, ClaimStatus } from './interfaces/claim.interface';

@Injectable()
export class ClaimsService {
	private readonly DAILY_COOLDOWN_HOURS = 24;
	private readonly QUICK_COOLDOWN_HOURS = 4;
	private readonly QUICK_REWARD_MULTIPLIER = 0.4;

	// Base rewards for 1 pet
	private readonly BASE_FOOD_ITEMS = 6;
	private readonly BASE_DRINK_ITEMS = 6;
	private readonly BASE_HYGIENE_ITEMS = 4;
	private readonly BASE_CARE_ITEMS = 4;
	private readonly BASE_EGG_CHANCE = 0.35;

	// Tier weights (must sum to 100)
	private readonly TIER_WEIGHTS = {
		[ItemTier.BASIC]: 60,
		[ItemTier.COMMON]: 25,
		[ItemTier.PREMIUM]: 10,
		[ItemTier.LEGENDARY]: 5,
	};

	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		private readonly usersService: UsersService,
	) {}

	async getClaimStatus(userId: Types.ObjectId): Promise<ClaimStatus> {
		const user = await this.userModel.findById(userId).exec();
		if (!user) throw new NotFoundException();

		const pets = await this.petModel.find({ parents: { $in: [userId] } }).exec();
		const petCount = pets.filter((pet) => !pet.isEgg).length;

		const now = new Date();
		const dailyAvailable = this.checkCooldown(user.lastDailyClaimTime, this.DAILY_COOLDOWN_HOURS, now);
		const quickAvailable = this.checkCooldown(user.lastQuickClaimTime, this.QUICK_COOLDOWN_HOURS, now);

		return {
			dailyAvailable,
			quickAvailable,
			nextDailyTime: dailyAvailable ? undefined : this.getNextClaimTime(user.lastDailyClaimTime!, this.DAILY_COOLDOWN_HOURS),
			nextQuickTime: quickAvailable ? undefined : this.getNextClaimTime(user.lastQuickClaimTime!, this.QUICK_COOLDOWN_HOURS),
			petCount,
		};
	}

	async claimDaily(userId: Types.ObjectId): Promise<ClaimResult> {
		return this.executeClaim(userId, 'daily');
	}

	async claimQuick(userId: Types.ObjectId): Promise<ClaimResult> {
		return this.executeClaim(userId, 'quick');
	}

	async claimDebug(userId: Types.ObjectId): Promise<ClaimResult> {
		if (process.env.NODE_ENV !== 'development' && process.env.ALLOW_DEBUG_CLAIMS !== 'true') {
			throw new BadRequestException('Debug claims are only available in development mode');
		}
		return this.executeClaim(userId, 'daily', true);
	}

	private async executeClaim(userId: Types.ObjectId, claimType: 'daily' | 'quick', skipCooldown = false): Promise<ClaimResult> {
		const user = await this.userModel.findById(userId).exec();
		if (!user) throw new NotFoundException();

		const pets = await this.petModel.find({ parents: { $in: [userId] } }).exec();
		const activePets = pets.filter((pet) => !pet.isEgg);
		const petCount = activePets.length;

		const now = new Date();
		const cooldownHours = claimType === 'daily' ? this.DAILY_COOLDOWN_HOURS : this.QUICK_COOLDOWN_HOURS;
		const lastClaimTime = claimType === 'daily' ? user.lastDailyClaimTime : user.lastQuickClaimTime;

		if (!skipCooldown && !this.checkCooldown(lastClaimTime, cooldownHours, now)) {
			throw new BadRequestException('Claim not yet available');
		}

		// Calculate rewards
		const rewards = this.calculateRewards(petCount, claimType === 'quick');

		// Add items to inventory
		for (const item of rewards.rewards.food) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		for (const item of rewards.rewards.drinks) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		for (const item of rewards.rewards.hygiene) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		for (const item of rewards.rewards.care) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}
		if (rewards.rewards.eggs > 0) {
			await this.usersService.addInventory(userId.toString(), EGG_ITEM_NAME, rewards.rewards.eggs);
		}
		for (const item of rewards.rewards.valentines || []) {
			await this.usersService.addInventory(userId.toString(), item.name, item.quantity);
		}

		// Update claim timestamp
		const updateField = claimType === 'daily' ? 'lastDailyClaimTime' : 'lastQuickClaimTime';
		await this.userModel.findByIdAndUpdate(userId, { [updateField]: now }).exec();

		return rewards;
	}

	private calculateRewards(petCount: number, isQuick: boolean): ClaimResult {
		const multiplier = isQuick ? this.QUICK_REWARD_MULTIPLIER : 1.0;
		// Ensure minimum rewards even with 0 pets
		const petMultiplier = Math.max(1, Math.sqrt(petCount));

		// Calculate base amounts
		const foodCount = Math.floor(this.BASE_FOOD_ITEMS * petMultiplier * multiplier);
		const drinkCount = Math.floor(this.BASE_DRINK_ITEMS * petMultiplier * multiplier);
		const hygieneCount = Math.floor(this.BASE_HYGIENE_ITEMS * petMultiplier * multiplier);
		const careCount = Math.floor(this.BASE_CARE_ITEMS * petMultiplier * multiplier);

		// Select random items from each category
		const foodItems = this.selectRandomItems(PetActionCategory.FEED, foodCount);
		const drinkItems = this.selectRandomItems(PetActionCategory.DRINK, drinkCount);
		const hygieneItems = this.selectRandomItems(PetActionCategory.WASH, hygieneCount);
		const careItems = this.selectRandomItems(PetActionCategory.CARE, careCount);

		// Calculate egg chance (decreases with more pets: 35% → 5%)
		const eggChance = Math.max(this.BASE_EGG_CHANCE / (1 + petCount * 0.6), 0.05);
		const earnedEggs = Math.random() < eggChance ? 1 : 0;

		// Valentine bonus (February only)
		const valentineItems = this.isValentineSeason()
			? this.selectRandomValentineItems(Math.floor(2 * petMultiplier * multiplier))
			: [];

		const valentineCount = valentineItems.reduce((sum, item) => sum + item.quantity, 0);
		const totalItems = foodCount + drinkCount + hygieneCount + careCount + earnedEggs + valentineCount;
		const cooldownHours = isQuick ? this.QUICK_COOLDOWN_HOURS : this.DAILY_COOLDOWN_HOURS;
		const nextClaimTime = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);

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
			totalItems,
			nextClaimTime,
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
			const selectedItem = availableItems.length > 0 ? availableItems[Math.floor(Math.random() * availableItems.length)] : tierItems[Math.floor(Math.random() * tierItems.length)];

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
		if (rand < this.TIER_WEIGHTS[ItemTier.BASIC] + this.TIER_WEIGHTS[ItemTier.COMMON] + this.TIER_WEIGHTS[ItemTier.PREMIUM]) return ItemTier.PREMIUM;
		return ItemTier.LEGENDARY;
	}

	private checkCooldown(lastClaimTime: Date | undefined, cooldownHours: number, now: Date): boolean {
		if (!lastClaimTime) return true;
		const timeSinceLastClaim = now.getTime() - lastClaimTime.getTime();
		const cooldownMs = cooldownHours * 60 * 60 * 1000;
		return timeSinceLastClaim >= cooldownMs;
	}

	private getNextClaimTime(lastClaimTime: Date, cooldownHours: number): Date {
		return new Date(lastClaimTime.getTime() + cooldownHours * 60 * 60 * 1000);
	}

	private isValentineSeason(): boolean {
		return new Date().getMonth() === 1; // February
	}

	private selectRandomValentineItems(count: number): ItemReward[] {
		const itemCounts = new Map<string, { count: number; tier: ItemTier }>();

		const itemsByTier = new Map<ItemTier, (typeof VALENTINE_GIFT_ITEMS)[number][]>();
		VALENTINE_GIFT_ITEMS.forEach((item) => {
			if (!itemsByTier.has(item.tier)) itemsByTier.set(item.tier, []);
			itemsByTier.get(item.tier)!.push(item);
		});

		for (let i = 0; i < count; i++) {
			const tier = this.selectWeightedTier();
			const tierItems = itemsByTier.get(tier) || [];
			if (tierItems.length === 0) continue;

			const selected = tierItems[Math.floor(Math.random() * tierItems.length)];
			const existing = itemCounts.get(selected.name);
			if (existing) {
				existing.count++;
			} else {
				itemCounts.set(selected.name, { count: 1, tier: selected.tier });
			}
		}

		const result: ItemReward[] = [];
		itemCounts.forEach(({ count: qty, tier }, name) => {
			result.push({ name, quantity: qty, tier });
		});
		return result;
	}
}
