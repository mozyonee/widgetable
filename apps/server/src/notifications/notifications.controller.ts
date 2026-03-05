import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserDocument } from 'src/users/entities/user.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(
		private readonly notificationsService: NotificationsService,
		private readonly configService: ConfigService,
	) {}

	@Get('vapid-public-key')
	getVapidPublicKey() {
		return { key: this.configService.get<string>('VAPID_PUBLIC_KEY') };
	}

	@Post('subscribe')
	subscribe(
		@GetUser() user: UserDocument,
		@Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
	) {
		return this.notificationsService.subscribe(user._id, body);
	}

	@Delete('subscribe')
	unsubscribe(@Body() body: { endpoint: string }) {
		return this.notificationsService.unsubscribe(body.endpoint);
	}
}
