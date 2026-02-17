import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), UsersModule, NotificationsModule],
	controllers: [GiftsController],
	providers: [GiftsService],
})
export class GiftsModule {}
