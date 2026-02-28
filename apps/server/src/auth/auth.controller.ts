import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserDocument } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() authDto: AuthDto) {
		return this.authService.register(authDto.email, authDto.password);
	}

	@Post('login')
	@HttpCode(200)
	async login(@Body() authDto: AuthDto) {
		return this.authService.login(authDto.email, authDto.password);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getMe(@GetUser() user: UserDocument) {
		return user;
	}
}
