import { Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as Minio from 'minio';
import { Model } from 'mongoose';
import * as path from 'path';
import { STORAGE_CLIENT, StorageBucket } from 'src/storage/storage.config';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
		@Inject(STORAGE_CLIENT) private readonly s3Client: Minio.Client,
	) {}

	async findByEmail(email: string): Promise<UserDocument | null> {
		return this.userModel.findOne({ email }).exec();
	}

	async findById(id: string): Promise<UserDocument | null> {
		return this.userModel.findById(id).exec();
	}

	async create(email: string, hashedPassword: string): Promise<User> {
		const newUser = new this.userModel({
			email,
			password: hashedPassword,
		});
		return newUser.save();
	}

	async getImage(userId: string) {
		const user = await this.userModel.findById(userId);
		if (!user || !user.picture) {
			throw new NotFoundException('User not found');
		}

		const s3Response = await this.s3Client.getObject(StorageBucket.AVATARS, user.picture);

		if (!s3Response) {
			throw new NotFoundException('Нет аватарки');
		}

		return new StreamableFile(s3Response, {
			type: 'image/jpeg',
		});
	}

	async setImage(userId: string, file: Express.Multer.File): Promise<UserDocument> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException('User not found');

		const oldPicture = user.picture;

		const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
		await this.s3Client.putObject(StorageBucket.AVATARS, fileName, file.buffer, file.buffer.length, {
			ContentType: file.mimetype,
		});

		const updatedUser = await this.userModel.findByIdAndUpdate(
			userId,
			{ picture: fileName },
			{ new: true },
		);

		if (!updatedUser) throw new NotFoundException('User not found');
		if (oldPicture) void this.s3Client.removeObject(StorageBucket.AVATARS, oldPicture);

		return updatedUser;
	}

	async updateName(userId: string, name: string): Promise<UserDocument> {
		const user = await this.userModel.findByIdAndUpdate(userId, { name }, { new: true });
		if (!user) throw new NotFoundException('User not found');
		return user;
	}
}
