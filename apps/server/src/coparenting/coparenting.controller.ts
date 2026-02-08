import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { RequestType } from '@widgetable/types';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequestsService } from 'src/requests/requests.service';
import { UserRequest } from 'src/users/entities/user.entity';
import { CoparentingService } from './coparenting.service';

@Controller('coparenting')
@UseGuards(JwtAuthGuard)
export class CoparentingController {
	constructor(
		private readonly coparentingService: CoparentingService,
		private readonly requestsService: RequestsService,
	) {}

	@Get('requests')
	getCoparentingRequests(@Request() req: UserRequest) {
		const userId = req.user._id.toString();
		return this.requestsService.getRequests(userId, RequestType.COPARENTING_REQUEST);
	}

	@Post('requests')
	sendCoparentingRequest(
		@Request() req: UserRequest,
		@Body('recipientId') recipientId: string,
		@Body('petId') petId: string,
	) {
		const userId = req.user._id.toString();
		return this.coparentingService.sendCoparentingRequest(userId, recipientId, petId);
	}

	@Post('requests/:id/accept')
	acceptCoparentingRequest(@Request() req: UserRequest, @Param('id') id: string) {
		const userId = req.user._id.toString();
		return this.coparentingService.acceptCoparentingRequest(id, userId);
	}

	@Delete('requests/:id/decline')
	declineCoparentingRequest(@Request() req: UserRequest, @Param('id') id: string) {
		const userId = req.user._id.toString();
		return this.coparentingService.declineCoparentingRequest(id, userId);
	}

	@Delete('requests/:id/cancel')
	cancelCoparentingRequest(@Request() req: UserRequest, @Param('id') id: string) {
		const userId = req.user._id.toString();
		return this.coparentingService.cancelCoparentingRequest(id, userId);
	}
}
