import { Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as Minio from 'minio';
import { Model } from 'mongoose';
import * as path from 'path';
import { STORAGE_CLIENT, StorageBucket } from 'src/storage/storage.config';
import { User, UserDocument } from './entities/user.entity';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

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

		const buffer = await this.streamToBuffer(s3Response);

		return new StreamableFile(buffer, {
			type: 'image/jpeg',
		});
	}

	async setImage(userId: string, file: Express.Multer.File) {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException('User not found');

		if (user.picture) void this.s3Client.removeObject(StorageBucket.AVATARS, user.picture);

		const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
		await this.s3Client.putObject(StorageBucket.AVATARS, fileName, file.buffer, file.buffer.length, {
			ContentType: file.mimetype,
		});

		await this.userModel.findByIdAndUpdate(userId, {
			picture: fileName,
		});
	}

	streamToBuffer = async (stream: Readable): Promise<Buffer> => {
		const chunks: Buffer[] = [];
		return new Promise((resolve, reject) => {
			stream.on('data', (chunk: Buffer) => chunks.push(chunk));
			stream.on('end', () => resolve(Buffer.concat(chunks)));
			stream.on('error', reject);
		});
	};
}
