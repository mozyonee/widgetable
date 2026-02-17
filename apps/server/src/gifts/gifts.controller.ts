import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { GiftsService } from './gifts.service';
import { SendGiftDto } from './dto/send-gift.dto';

@Controller('gifts')
@UseGuards(JwtAuthGuard)
export class GiftsController {
	constructor(private readonly giftsService: GiftsService) {}

	@Post('send')
	async sendGift(@GetUser() user: UserDocument, @Body() body: SendGiftDto) {
		return this.giftsService.sendGift(user._id, body.recipientId, body.itemName, body.quantity);
	}
}
