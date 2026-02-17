import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async register(email: string, password: string) {
		const existingUser = await this.usersService.findByEmail(email);
		if (existingUser) throw new BadRequestException();

		const hashedPassword = await this.hashPassword(password);
		const user = await this.usersService.create(email, hashedPassword);
		const token = this.generateToken(user);

		return { user, token };
	}

	async login(email: string, password: string) {
		const user = await this.usersService.findByEmail(email);
		if (!user) throw new UnauthorizedException();

		const isPasswordValid = await this.verifyPassword(user.password, password);
		if (!isPasswordValid) throw new UnauthorizedException();

		const token = this.generateToken(user);

		return { user, token };
	}

	private async hashPassword(password: string): Promise<string> {
		return argon2.hash(password);
	}

	private async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
		return argon2.verify(hashedPassword, plainPassword);
	}

	private generateToken(user: UserDocument) {
		const payload = {
			sub: user._id,
			email: user.email,
		};

		return this.jwtService.sign(payload);
	}
}
