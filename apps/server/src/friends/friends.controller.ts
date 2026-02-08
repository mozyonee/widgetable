import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { RequestType } from '@widgetable/types';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RequestsService } from 'src/requests/requests.service';
import { UserRequest } from 'src/users/entities/user.entity';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
	constructor(
		private readonly friendsService: FriendsService,
		private readonly requestsService: RequestsService,
	) {}

	@Get()
	getFriends(@Request() req: UserRequest) {
		const userId = req.user._id.toString();
		return this.friendsService.getFriends(userId);
	}

	@Delete(':friendId')
	removeFriend(@Request() req: UserRequest, @Param('friendId') friendId: string) {
		const userId = req.user._id.toString();
		return this.friendsService.removeFriend(userId, friendId);
	}

	@Get('requests')
	getFriendRequests(@Request() req: UserRequest) {
		const userId = req.user._id.toString();
		return this.requestsService.getRequests(userId, RequestType.FRIEND_REQUEST);
	}

	@Post('requests')
	sendFriendRequest(@Request() req: UserRequest, @Body('recipientId') recipientId: string) {
		const userId = req.user._id.toString();
		return this.friendsService.sendFriendRequest(userId, recipientId);
	}

	@Post('requests/:id/accept')
	acceptFriendRequest(@Request() req: UserRequest, @Param('id') id: string) {
		const userId = req.user._id.toString();
		return this.friendsService.acceptFriendRequest(id, userId);
	}

	@Delete('requests/:id/decline')
	declineFriendRequest(@Request() req: UserRequest, @Param('id') id: string) {
		const userId = req.user._id.toString();
		return this.friendsService.declineFriendRequest(id, userId);
	}

	@Delete('requests/:id/cancel')
	cancelFriendRequest(@Request() req: UserRequest, @Param('id') id: string) {
		const userId = req.user._id.toString();
		return this.friendsService.cancelFriendRequest(id, userId);
	}
}
