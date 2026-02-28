import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserDocument } from 'src/users/entities/user.entity';
import { ClaimsService } from './claims.service';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
	constructor(private readonly claimsService: ClaimsService) {}

	@Get('status')
	async getStatus(@GetUser() user: UserDocument) {
		return this.claimsService.getClaimStatus(user._id);
	}

	@Post('daily')
	async claimDaily(@GetUser() user: UserDocument) {
		return this.claimsService.claimDaily(user._id);
	}

	@Post('quick')
	async claimQuick(@GetUser() user: UserDocument) {
		return this.claimsService.claimQuick(user._id);
	}

	@Post('debug')
	async claimDebug(@GetUser() user: UserDocument) {
		return this.claimsService.claimDebug(user._id);
	}
}
