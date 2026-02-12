import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Pet, PetSchema } from 'src/pets/entities/pet.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { PushSubscription, PushSubscriptionSchema } from './entities/push-subscription.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([
			{ name: PushSubscription.name, schema: PushSubscriptionSchema },
			{ name: Pet.name, schema: PetSchema },
			{ name: User.name, schema: UserSchema },
		]),
	],
	controllers: [NotificationsController],
	providers: [NotificationsService],
	exports: [NotificationsService],
})
export class NotificationsModule {}
