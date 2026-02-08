import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Query,
	Request,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserRequest } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get(':id/picture')
	getImage(@Param('id') id: string) {
		return this.usersService.getImage(id);
	}

	@Patch('picture')
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
	setImage(@Request() req: UserRequest, @UploadedFile() file: Express.Multer.File) {
		if (!file) throw new BadRequestException();
		const userId = req.user._id.toString();
		return this.usersService.setImage(userId, file);
	}

	@Patch('name')
	updateName(@Request() req: UserRequest, @Body('name') name: string) {
		if (!name || name.trim().length === 0) throw new BadRequestException();
		const userId = req.user._id.toString();
		return this.usersService.updateName(userId, name.trim());
	}

	@Get('search')
	searchUsers(@Query('query') query: string) {
		if (!query || query.trim().length === 0) throw new BadRequestException();
		return this.usersService.searchUsers(query.trim());
	}
}
