import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname } from 'path';
import { AuthModule } from 'src/auth/auth.module';
import { ClaimsModule } from 'src/claims/claims.module';
import { CoparentingModule } from 'src/coparenting/coparenting.module';
import { FriendsModule } from 'src/friends/friends.module';
import { PetsModule } from 'src/pets/pets.module';
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
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('MONGODB_URI'),
			}),
			inject: [ConfigService],
		}),
		StorageModule,
		UsersModule,
		FriendsModule,
		CoparentingModule,
		PetsModule,
		AuthModule,
		ClaimsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
