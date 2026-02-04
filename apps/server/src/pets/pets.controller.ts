import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Pet } from './entities/pet.entity';
import { PetsService } from './pets.service';
import { UserRequest } from 'src/users/entities/user.entity';

@Controller('pets')
export class PetsController {
	constructor(private readonly petsService: PetsService) {}

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
	update(@Param('id') id: string, @Body() petBody: Partial<Pet>) {
		const petId = new Types.ObjectId(id);
		return this.petsService.update(petId, petBody);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		const petId = new Types.ObjectId(id);
		return this.petsService.remove(petId);
	}
}
