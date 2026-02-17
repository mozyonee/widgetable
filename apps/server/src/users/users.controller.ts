import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Query,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Types } from 'mongoose';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-objectid.pipe';
import { AddInventoryDto } from './dto/add-inventory.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateNameDto } from './dto/update-name.dto';
import { UserDocument } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get(':id/picture')
	async getImage(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Res() res: Response) {
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
	setImage(@GetUser() user: UserDocument, @UploadedFile() file: Express.Multer.File) {
		if (!file) throw new BadRequestException();
		return this.usersService.setImage(user._id, file);
	}

	@Patch('name')
	@UseGuards(JwtAuthGuard)
	updateName(@GetUser() user: UserDocument, @Body() body: UpdateNameDto) {
		return this.usersService.updateName(user._id, body.name);
	}

	@Patch('language')
	@UseGuards(JwtAuthGuard)
	updateLanguage(@GetUser() user: UserDocument, @Body() body: UpdateLanguageDto) {
		return this.usersService.updateLanguage(user._id, body.language);
	}

	@Get('search')
	@UseGuards(JwtAuthGuard)
	searchUsers(@Query() query: SearchUsersDto) {
		return this.usersService.searchUsers(query.query);
	}

	@Patch('inventory/add')
	@UseGuards(JwtAuthGuard)
	addInventory(@GetUser() user: UserDocument, @Body() body: AddInventoryDto) {
		return this.usersService.addInventory(user._id, body.actionName, body.amount || 1);
	}
}
