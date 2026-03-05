import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EGG_ITEM_NAME, PET_ACTIONS_BY_CATEGORY } from '@widgetable/types';
import { Types } from 'mongoose';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';
import { UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetsService } from './pets.service';

@Controller('pets')
export class PetsController {
	constructor(
		private readonly petsService: PetsService,
		private readonly usersService: UsersService,
	) {}

	@Get('user')
	@UseGuards(JwtAuthGuard)
	getPetsForUser(@GetUser() user: UserDocument) {
		return this.petsService.getPetsForUser(user._id);
	}

	@Get(':id')
	getPet(@Param('id', ParseObjectIdPipe) petId: Types.ObjectId) {
		return this.petsService.getPet(petId);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async create(@GetUser() user: UserDocument) {
		const userId = user._id;

		const hasEgg = await this.usersService.hasInventory(userId, EGG_ITEM_NAME, 1);
		if (!hasEgg) throw new BadRequestException();

		await this.usersService.consumeInventory(userId, EGG_ITEM_NAME, 1);
		return this.petsService.create(userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	async update(
		@Param('id', ParseObjectIdPipe) petId: Types.ObjectId,
		@Body() body: UpdatePetDto,
		@GetUser() user: UserDocument,
	) {
		const userId = user._id;

		if (body.action) {
			const action = Object.values(PET_ACTIONS_BY_CATEGORY)
				.flat()
				.find((a) => a.name === body.action);

			if (!action) throw new BadRequestException();

			if (action.inventoryCost) {
				await this.usersService.consumeInventory(userId, body.action, 1);
			}

			const currentPet = await this.petsService.getPet(petId);
			const currentNeedValue = currentPet.needs[action.needKey];
			const newNeedValue = Math.min(currentNeedValue + action.amount, 100);

			return this.petsService.update(petId, { needs: { [action.needKey]: newNeedValue } }, action.experience);
		}

		return this.petsService.update(petId, body);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	remove(@Param('id', ParseObjectIdPipe) petId: Types.ObjectId, @GetUser() user: UserDocument) {
		const userId = user._id;
		return this.petsService.remove(petId, userId);
	}

	@Post(':id/expedition/start')
	@UseGuards(JwtAuthGuard)
	async startExpedition(@Param('id', ParseObjectIdPipe) petId: Types.ObjectId, @GetUser() user: UserDocument) {
		return this.petsService.startExpedition(petId, user._id);
	}

	@Post(':id/expedition/claim')
	@UseGuards(JwtAuthGuard)
	async claimExpedition(@Param('id', ParseObjectIdPipe) petId: Types.ObjectId, @GetUser() user: UserDocument) {
		return this.petsService.claimExpedition(petId, user._id);
	}
}
