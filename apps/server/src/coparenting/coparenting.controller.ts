import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequestType } from '@widgetable/types';
import { Types } from 'mongoose';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';
import { RequestsService } from 'src/requests/requests.service';
import { UserDocument } from 'src/users/entities/user.entity';
import { CoparentingService } from './coparenting.service';
import { SendCoparentingRequestDto } from './dto/send-coparenting-request.dto';

@Controller('coparenting')
@UseGuards(JwtAuthGuard)
export class CoparentingController {
	constructor(
		private readonly coparentingService: CoparentingService,
		private readonly requestsService: RequestsService,
	) {}

	@Get('requests')
	getCoparentingRequests(@GetUser() user: UserDocument) {
		return this.requestsService.getRequests(user._id, RequestType.COPARENTING_REQUEST);
	}

	@Post('requests')
	sendCoparentingRequest(@GetUser() user: UserDocument, @Body() body: SendCoparentingRequestDto) {
		return this.coparentingService.sendCoparentingRequest(
			user._id,
			new Types.ObjectId(body.recipientId),
			new Types.ObjectId(body.petId),
		);
	}

	@Post('requests/:id/accept')
	acceptCoparentingRequest(@GetUser() user: UserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
		return this.coparentingService.acceptCoparentingRequest(id, user._id);
	}

	@Delete('requests/:id/decline')
	declineCoparentingRequest(@GetUser() user: UserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
		return this.coparentingService.declineCoparentingRequest(id, user._id);
	}

	@Delete('requests/:id/cancel')
	cancelCoparentingRequest(@GetUser() user: UserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
		return this.coparentingService.cancelCoparentingRequest(id, user._id);
	}
}
