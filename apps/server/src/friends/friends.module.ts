import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestsModule } from 'src/requests/requests.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), RequestsModule],
	controllers: [FriendsController],
	providers: [FriendsService],
	exports: [FriendsService],
})
export class FriendsModule {}
