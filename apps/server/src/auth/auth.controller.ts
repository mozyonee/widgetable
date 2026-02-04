import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthDto } from './dto/auth.dto';
import { User } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() authDto: AuthDto) {
		return this.authService.register(authDto.email, authDto.password);
	}

	@Post('login')
	@HttpCode(200)
	async login(@Body() authDto: AuthDto, @Res({ passthrough: true }) response: Response) {
		const { cookie, user } = await this.authService.login(authDto.email, authDto.password);

		response.setHeader('Set-Cookie', cookie);
		return user;
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getMe(@GetUser() user: User) {
		return user;
	}

	@Post('logout')
	@HttpCode(200)
	logout(@Res({ passthrough: true }) response: Response) {
		const cookie = this.authService.getCookieForLogout();
		response.setHeader('Set-Cookie', cookie);
		return { message: 'Успешный выход из системы' };
	}
}
