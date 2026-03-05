import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pet, PetSchema } from 'src/pets/entities/pet.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: Pet.name, schema: PetSchema },
		]),
		UsersModule,
	],
	controllers: [ItemsController],
	providers: [ItemsService],
	exports: [ItemsService],
})
export class ItemsModule {}
