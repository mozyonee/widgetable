import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private configService: ConfigService,
		private usersService: UsersService,
		@InjectModel(User.name) private userModel: Model<UserDocument>,
	) {
		const secret = configService.getOrThrow<string>('JWT_SECRET');

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: secret,
		});
	}

	async validate(payload: { sub: string; email: string }) {
		const user = await this.usersService.findByEmail(payload.email);
		if (!user) {
			throw new UnauthorizedException();
		}
		// Migration path for users created before inventory feature
		if (!user.inventory) {
			await this.userModel.findByIdAndUpdate(user._id, { inventory: {} });
			user.inventory = {};
		}

		return user;
	}
}
