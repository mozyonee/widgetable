import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname } from 'path';
import { AuthModule } from 'src/auth/auth.module';
import { CoparentingModule } from 'src/coparenting/coparenting.module';
import { FriendsModule } from 'src/friends/friends.module';
import { GiftsModule } from 'src/gifts/gifts.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PetsModule } from 'src/pets/pets.module';
import { ItemsModule } from 'src/items/items.module';
import { StorageModule } from 'src/storage/storage.module';
import { UsersModule } from 'src/users/users.module';
import { v4 as uuidv4 } from 'uuid';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env.local', '.env'],
			expandVariables: true,
		}),
		MulterModule.register({
			storage: diskStorage({
				destination: tmpdir(),
				filename: (req, file, callback) => {
					const uniqueSuffix = uuidv4();
					const ext = extname(file.originalname);
					callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
				},
			}),
			limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
		}),
		MongooseModule.forRootAsync({
			useFactory: (configService: ConfigService) => {
				const uri = configService.get<string>('MONGODB_URI');
				const isRailway = uri?.includes('.railway.internal');
				return {
					uri,
					...(isRailway && { family: 6, directConnection: true }),
				};
			},
			inject: [ConfigService],
		}),
		StorageModule,
		UsersModule,
		FriendsModule,
		GiftsModule,
		CoparentingModule,
		PetsModule,
		AuthModule,
		ItemsModule,
		NotificationsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
