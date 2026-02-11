import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserRequest } from 'src/users/entities/user.entity';
import { ClaimsService } from './claims.service';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
	constructor(private readonly claimsService: ClaimsService) {}

	@Get('status')
	async getStatus(@Request() req: UserRequest) {
		return this.claimsService.getClaimStatus(req.user._id);
	}

	@Post('daily')
	async claimDaily(@Request() req: UserRequest) {
		return this.claimsService.claimDaily(req.user._id);
	}

	@Post('quick')
	async claimQuick(@Request() req: UserRequest) {
		return this.claimsService.claimQuick(req.user._id);
	}

	@Post('debug')
	async claimDebug(@Request() req: UserRequest) {
		return this.claimsService.claimDebug(req.user._id);
	}
}
