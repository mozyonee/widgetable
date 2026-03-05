import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsModule } from 'src/items/items.module';
import { UsersModule } from 'src/users/users.module';
import { Pet, PetSchema } from './entities/pet.entity';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

@Module({
	imports: [MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }]), UsersModule, ItemsModule],
	controllers: [PetsController],
	providers: [PetsService],
	exports: [PetsService],
})
export class PetsModule {}
