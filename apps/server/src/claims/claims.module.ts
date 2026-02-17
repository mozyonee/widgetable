import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pet, PetSchema } from 'src/pets/entities/pet.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: Pet.name, schema: PetSchema },
		]),
		UsersModule,
	],
	controllers: [ClaimsController],
	providers: [ClaimsService],
	exports: [ClaimsService],
})
export class ClaimsModule {}
