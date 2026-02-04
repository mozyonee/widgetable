import { BadRequestException, Controller, Get, Param, Patch, UploadedFile, UseInterceptors } from '@nestjs/common';
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

		void this.usersService.setImage(id, file);
	}
}
