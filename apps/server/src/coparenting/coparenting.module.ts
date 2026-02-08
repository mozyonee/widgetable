import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pet, PetSchema } from 'src/pets/entities/pet.entity';
import { RequestsModule } from 'src/requests/requests.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { CoparentingController } from './coparenting.controller';
import { CoparentingService } from './coparenting.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: Pet.name, schema: PetSchema },
		]),
		RequestsModule,
	],
	controllers: [CoparentingController],
	providers: [CoparentingService],
	exports: [CoparentingService],
})
export class CoparentingModule {}
