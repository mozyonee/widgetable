import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Query,
	Request,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserRequest } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get(':id/picture')
	async getImage(@Param('id') id: string, @Res() res: Response) {
		const url = await this.usersService.getImageUrl(id);
		res.redirect(url);
	}

	@Patch('picture')
	@UseGuards(JwtAuthGuard)
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
	@UseGuards(JwtAuthGuard)
	updateName(@Request() req: UserRequest, @Body('name') name: string) {
		if (!name || name.trim().length === 0) throw new BadRequestException();
		const userId = req.user._id.toString();
		return this.usersService.updateName(userId, name.trim());
	}

	@Patch('language')
	@UseGuards(JwtAuthGuard)
	updateLanguage(@Request() req: UserRequest, @Body('language') language: string) {
		if (!language || language.trim().length === 0) throw new BadRequestException();
		const userId = req.user._id.toString();
		return this.usersService.updateLanguage(userId, language.trim());
	}

	@Get('search')
	@UseGuards(JwtAuthGuard)
	searchUsers(@Query('query') query: string) {
		if (!query || query.trim().length === 0) throw new BadRequestException();
		return this.usersService.searchUsers(query.trim());
	}

	@Patch('inventory/add')
	@UseGuards(JwtAuthGuard)
	addInventory(@Request() req: UserRequest, @Body('actionName') actionName: string, @Body('amount') amount?: number) {
		if (!actionName || actionName.trim().length === 0) throw new BadRequestException();
		const userId = req.user._id.toString();
		return this.usersService.addInventory(userId, actionName.trim(), amount || 1);
	}
}
