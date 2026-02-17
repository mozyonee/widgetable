import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	CLAIMS_CONFIG,
	ClaimResult,
	ClaimStatus,
	EGG_ITEM_NAME,
	ItemReward,
	ItemTier,
	PetActionCategory,
	TIME_CONVERSION,
} from '@widgetable/types';
import { Model, Types } from 'mongoose';
import { Pet, PetDocument } from 'src/pets/entities/pet.entity';
import { RewardsService } from 'src/shared/rewards.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ClaimsService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@InjectModel(Pet.name) private petModel: Model<PetDocument>,
		private readonly usersService: UsersService,
		private readonly rewardsService: RewardsService,
	) {}

	async getClaimStatus(userId: Types.ObjectId): Promise<ClaimStatus> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		const pets = await this.petModel.find({ parents: { $in: [userId] } });
		const petCount = pets.filter((pet) => !pet.isEgg).length;

		const now = new Date();
		const dailyAvailable = this.checkCooldown(user.lastDailyClaimTime, CLAIMS_CONFIG.DAILY_COOLDOWN_HOURS, now);
		const quickAvailable = this.checkCooldown(user.lastQuickClaimTime, CLAIMS_CONFIG.QUICK_COOLDOWN_HOURS, now);

		return {
			dailyAvailable,
			quickAvailable,
			nextDailyTime: dailyAvailable
				? undefined
				: this.getNextClaimTime(user.lastDailyClaimTime!, CLAIMS_CONFIG.DAILY_COOLDOWN_HOURS),
			nextQuickTime: quickAvailable
				? undefined
				: this.getNextClaimTime(user.lastQuickClaimTime!, CLAIMS_CONFIG.QUICK_COOLDOWN_HOURS),
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
			throw new BadRequestException();
		}
		return this.executeClaim(userId, 'daily', true);
	}

	private async executeClaim(
		userId: Types.ObjectId,
		claimType: 'daily' | 'quick',
		skipCooldown = false,
	): Promise<ClaimResult> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		const pets = await this.petModel.find({ parents: { $in: [userId] } });
		const activePets = pets.filter((pet) => !pet.isEgg);
		const petCount = activePets.length;

		const now = new Date();
		const cooldownHours =
			claimType === 'daily' ? CLAIMS_CONFIG.DAILY_COOLDOWN_HOURS : CLAIMS_CONFIG.QUICK_COOLDOWN_HOURS;
		const lastClaimTime = claimType === 'daily' ? user.lastDailyClaimTime : user.lastQuickClaimTime;

		if (!skipCooldown && !this.checkCooldown(lastClaimTime, cooldownHours, now)) {
			throw new BadRequestException();
		}

		// Calculate rewards
		const rewards = this.calculateRewards(petCount, claimType === 'quick');

		await this.usersService.applyRewards(userId, rewards.rewards);

		// Update claim timestamp
		const updateField = claimType === 'daily' ? 'lastDailyClaimTime' : 'lastQuickClaimTime';
		await this.userModel.findByIdAndUpdate(userId, { [updateField]: now });

		return rewards;
	}

	private calculateRewards(petCount: number, isQuick: boolean): ClaimResult {
		const multiplier = isQuick ? CLAIMS_CONFIG.QUICK_REWARD_MULTIPLIER : 1.0;
		// Ensure minimum rewards even with 0 pets
		const petMultiplier = Math.max(1, Math.sqrt(petCount));

		// Calculate base amounts
		const foodCount = Math.floor(CLAIMS_CONFIG.BASE_FOOD_ITEMS * petMultiplier * multiplier);
		const drinkCount = Math.floor(CLAIMS_CONFIG.BASE_DRINK_ITEMS * petMultiplier * multiplier);
		const hygieneCount = Math.floor(CLAIMS_CONFIG.BASE_HYGIENE_ITEMS * petMultiplier * multiplier);
		const careCount = Math.floor(CLAIMS_CONFIG.BASE_CARE_ITEMS * petMultiplier * multiplier);

		// Select random items from each category
		const foodItems = this.rewardsService.selectRandomItems(PetActionCategory.FEED, foodCount);
		const drinkItems = this.rewardsService.selectRandomItems(PetActionCategory.DRINK, drinkCount);
		const hygieneItems = this.rewardsService.selectRandomItems(PetActionCategory.WASH, hygieneCount);
		const careItems = this.rewardsService.selectRandomItems(PetActionCategory.CARE, careCount);

		// Calculate egg chance (decreases with more pets: 35% → 5%)
		const eggChance = Math.max(CLAIMS_CONFIG.BASE_EGG_CHANCE / (1 + petCount * 0.6), 0.05);
		const earnedEggs = Math.random() < eggChance ? 1 : 0;

		// Valentine bonus (February only)
		const valentineItems = this.rewardsService.isValentineSeason()
			? this.rewardsService.selectRandomValentineItems(Math.floor(2 * petMultiplier * multiplier))
			: [];

		const valentineCount = valentineItems.reduce((sum, item) => sum + item.quantity, 0);
		const totalItems = foodCount + drinkCount + hygieneCount + careCount + earnedEggs + valentineCount;
		const cooldownHours = isQuick ? CLAIMS_CONFIG.QUICK_COOLDOWN_HOURS : CLAIMS_CONFIG.DAILY_COOLDOWN_HOURS;
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

	private checkCooldown(lastClaimTime: Date | undefined, cooldownHours: number, now: Date): boolean {
		if (!lastClaimTime) return true;
		const timeSinceLastClaim = now.getTime() - lastClaimTime.getTime();
		const cooldownMs = TIME_CONVERSION.HOURS_TO_MS(cooldownHours);
		return timeSinceLastClaim >= cooldownMs;
	}

	private getNextClaimTime(lastClaimTime: Date, cooldownHours: number): Date {
		return new Date(lastClaimTime.getTime() + TIME_CONVERSION.HOURS_TO_MS(cooldownHours));
	}
}
