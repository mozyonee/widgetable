import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserDocument } from 'src/users/entities/user.entity';
import { SendGiftDto } from './dto/send-gift.dto';
import { GiftsService } from './gifts.service';

@Controller('gifts')
@UseGuards(JwtAuthGuard)
export class GiftsController {
	constructor(private readonly giftsService: GiftsService) {}

	@Post('send')
	async sendGift(@GetUser() user: UserDocument, @Body() body: SendGiftDto) {
		return this.giftsService.sendGift(user._id, body.recipientId, body.itemName, body.quantity);
	}
}
