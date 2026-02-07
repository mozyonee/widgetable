import { BadRequestException, Body, Controller, Get, Param, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
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
					return cb(new Error('Only image files are allowed'), false);
				}
				cb(null, true);
			},
		}),
	)
	setImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
		if (!file) throw new BadRequestException('No file uploaded');

		return this.usersService.setImage(id, file);
	}

	@Patch(':id/name')
	updateName(@Param('id') id: string, @Body('name') name: string) {
		if (!name || name.trim().length === 0) {
			throw new BadRequestException('Name cannot be empty');
		}
		return this.usersService.updateName(id, name.trim());
	}
}
