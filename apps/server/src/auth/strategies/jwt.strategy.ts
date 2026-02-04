import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRequest } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private configService: ConfigService,
		private usersService: UsersService,
	) {
		const secret = configService.getOrThrow<string>('JWT_SECRET');

		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: UserRequest) => {
					return request?.cookies?.Authentication;
				},
			]),
			secretOrKey: secret,
		});
	}

	async validate(payload: { sub: string; email: string }) {
		const user = await this.usersService.findByEmail(payload.email);
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}
}
