import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { Pet } from './entities/pet.entity';
import { PetsService } from './pets.service';
import { UserRequest } from 'src/users/entities/user.entity';

@Controller('pets')
export class PetsController {
	constructor(
		private readonly petsService: PetsService,
		private readonly usersService: UsersService,
	) {}

	@Get('user')
	@UseGuards(JwtAuthGuard)
	getPetsForUser(@Request() req: UserRequest) {
		return this.petsService.getPetsForUser(req.user._id);
	}

	@Get(':id')
	getPet(@Param('id') id: string) {
		const petId = new Types.ObjectId(id);
		return this.petsService.getPet(petId);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	create(@Request() req: UserRequest) {
		const userId = req.user._id;

		return this.petsService.create(userId);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	async update(@Param('id') id: string, @Body() body: Partial<Pet> & { actionName?: string }, @Request() req: UserRequest) {
		const petId = new Types.ObjectId(id);
		const userId = req.user._id.toString();

		// If actionName is provided, this is a pet action that requires inventory
		if (body.actionName) {
			await this.usersService.consumeInventory(userId, body.actionName, 1);

			const { actionName, ...petBody } = body;
			return this.petsService.update(petId, petBody);
		}

		return this.petsService.update(petId, body);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	remove(@Param('id') id: string, @Request() req: UserRequest) {
		const petId = new Types.ObjectId(id);
		const userId = req.user._id;
		return this.petsService.remove(petId, userId);
	}
}
