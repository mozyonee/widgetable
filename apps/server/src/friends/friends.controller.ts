import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestType } from '@widgetable/types';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';
import { RequestsService } from 'src/requests/requests.service';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
	constructor(
		private readonly friendsService: FriendsService,
		private readonly requestsService: RequestsService,
	) {}

	@Get()
	getFriends(@GetUser() user: UserDocument) {
		return this.friendsService.getFriends(user._id);
	}

	@Delete(':friendId')
	removeFriend(@GetUser() user: UserDocument, @Param('friendId', ParseObjectIdPipe) friendId: Types.ObjectId) {
		return this.friendsService.removeFriend(user._id, friendId);
	}

	@Get('requests')
	getFriendRequests(@GetUser() user: UserDocument) {
		return this.requestsService.getRequests(user._id, RequestType.FRIEND_REQUEST);
	}

	@Post('requests')
	sendFriendRequest(@GetUser() user: UserDocument, @Body() body: SendFriendRequestDto) {
		return this.friendsService.sendFriendRequest(user._id, new Types.ObjectId(body.recipientId));
	}

	@Post('requests/:id/accept')
	acceptFriendRequest(@GetUser() user: UserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
		return this.friendsService.acceptFriendRequest(id, user._id);
	}

	@Delete('requests/:id/decline')
	declineFriendRequest(@GetUser() user: UserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
		return this.friendsService.declineFriendRequest(id, user._id);
	}

	@Delete('requests/:id/cancel')
	cancelFriendRequest(@GetUser() user: UserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
		return this.friendsService.cancelFriendRequest(id, user._id);
	}
}
