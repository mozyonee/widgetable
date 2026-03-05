import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClaimType } from '@widgetable/types';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserDocument } from 'src/users/entities/user.entity';
import { ItemsService } from './items.service';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
	constructor(private readonly itemsService: ItemsService) {}

	@Get('status')
	async getStatus(@GetUser() user: UserDocument) {
		return this.itemsService.getItemStatus(user._id);
	}

	@Post('daily')
	async claimDaily(@GetUser() user: UserDocument) {
		return this.itemsService.executeClaim(user._id, ClaimType.DAILY);
	}

	@Post('quick')
	async claimQuick(@GetUser() user: UserDocument) {
		return this.itemsService.executeClaim(user._id, ClaimType.QUICK);
	}
}
