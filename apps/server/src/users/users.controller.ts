import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get(':id/picture')
	getImage(@Param('id') id: string) {
		return this.usersService.getImage(id);
	}

	@Patch(':id/picture')
	@UseInterceptors(
		FileInterceptor('picture', {
			fileFilter: (req, file, cb) => {
				if (!file.mimetype.startsWith('image/')) {
					return cb(new BadRequestException(), false);
				}
				cb(null, true);
			},
		}),
	)
	setImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
		if (!file) throw new BadRequestException();

		return this.usersService.setImage(id, file);
	}

	@Patch(':id/name')
	updateName(@Param('id') id: string, @Body('name') name: string) {
		if (!name || name.trim().length === 0) {
			throw new BadRequestException();
		}
		return this.usersService.updateName(id, name.trim());
	}

	@Get('search')
	searchUsers(@Query('query') query: string) {
		if (!query || query.trim().length === 0) {
			throw new BadRequestException();
		}
		return this.usersService.searchUsers(query.trim());
	}

	@Get(':id/friends')
	getFriends(@Param('id') id: string) {
		return this.usersService.getFriends(id);
	}

	@Get(':id/friend-requests')
	getFriendRequests(@Param('id') id: string) {
		return this.usersService.getFriendRequests(id);
	}

	@Post(':id/friend-requests/:friendId')
	sendFriendRequest(@Param('id') id: string, @Param('friendId') friendId: string) {
		return this.usersService.sendFriendRequest(id, friendId);
	}

	@Post(':id/friend-requests/:friendId/accept')
	acceptFriendRequest(@Param('id') id: string, @Param('friendId') friendId: string) {
		return this.usersService.acceptFriendRequest(id, friendId);
	}

	@Delete(':id/friend-requests/:friendId/decline')
	declineFriendRequest(@Param('id') id: string, @Param('friendId') friendId: string) {
		return this.usersService.declineFriendRequest(id, friendId);
	}

	@Delete(':id/friend-requests/:friendId/cancel')
	cancelFriendRequest(@Param('id') id: string, @Param('friendId') friendId: string) {
		return this.usersService.cancelFriendRequest(id, friendId);
	}

	@Delete(':id/friends/:friendId')
	removeFriend(@Param('id') id: string, @Param('friendId') friendId: string) {
		return this.usersService.removeFriend(id, friendId);
	}
}
