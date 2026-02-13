import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserRequest } from 'src/users/entities/user.entity';
import { GiftsService } from './gifts.service';

@Controller('gifts')
@UseGuards(JwtAuthGuard)
export class GiftsController {
	constructor(private readonly giftsService: GiftsService) {}

	@Post('send')
	async sendGift(
		@Request() req: UserRequest,
		@Body() body: { recipientId: string; itemName: string; quantity: number },
	) {
		const senderId = req.user._id.toString();
		return this.giftsService.sendGift(senderId, body.recipientId, body.itemName, body.quantity);
	}
}
