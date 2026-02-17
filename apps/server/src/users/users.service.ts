import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DEFAULT_LANGUAGE, EGG_ITEM_NAME } from '@widgetable/types';
import * as Minio from 'minio';
import { ClientSession, Model, Types } from 'mongoose';
import * as path from 'path';
import { SUPPORTED_LANGUAGES, USER_POPULATE_FIELDS, WEBPUSH_CONFIG } from 'src/shared/constants';
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
		return this.userModel.findOne({ email });
	}

	async findById(id: Types.ObjectId): Promise<UserDocument | null> {
		return this.userModel.findById(id);
	}

	async create(email: string, hashedPassword: string): Promise<UserDocument> {
		const defaultName = email.split('@')[0];
		const newUser = new this.userModel({
			email,
			password: hashedPassword,
			name: defaultName,
		});
		const savedUser = await newUser.save();

		const updatedUser = await this.addInventory(savedUser._id, EGG_ITEM_NAME, 1);

		return updatedUser;
	}

	async getImageUrl(userId: Types.ObjectId): Promise<string> {
		const user = await this.userModel.findById(userId);
		if (!user || !user.picture) throw new NotFoundException();

		return this.s3Client.presignedGetObject(
			StorageBucket.AVATARS,
			user.picture,
			WEBPUSH_CONFIG.PRESIGNED_URL_EXPIRY_SECONDS,
		);
	}

	async setImage(userId: Types.ObjectId, file: Express.Multer.File): Promise<UserDocument> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		const oldPicture = user.picture;

		const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
		await this.s3Client.putObject(StorageBucket.AVATARS, fileName, file.buffer, file.buffer.length, {
			ContentType: file.mimetype,
		});

		const updatedUser = await this.userModel.findByIdAndUpdate(userId, { picture: fileName }, { new: true });

		if (!updatedUser) throw new NotFoundException();
		if (oldPicture) void this.s3Client.removeObject(StorageBucket.AVATARS, oldPicture);

		return updatedUser;
	}

	async updateName(userId: Types.ObjectId, name: string): Promise<UserDocument> {
		const user = await this.userModel.findByIdAndUpdate(userId, { name }, { new: true });
		if (!user) throw new NotFoundException();
		return user;
	}

	async updateLanguage(userId: Types.ObjectId, language: string): Promise<UserDocument> {
		if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(language)) {
			throw new BadRequestException();
		}
		const user = await this.userModel.findByIdAndUpdate(userId, { language }, { new: true });
		if (!user) throw new NotFoundException();
		return user;
	}

	async searchUsers(query: string): Promise<Partial<UserDocument>[]> {
		const users = await this.userModel
			.find({
				$or: [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }],
			})
			.select(USER_POPULATE_FIELDS)
			.limit(20);

		return users;
	}

	async getUserLanguage(userId: Types.ObjectId): Promise<string> {
		const user = await this.userModel.findById(userId).select('language').lean();
		return user?.language || DEFAULT_LANGUAGE;
	}

	async getInventory(userId: Types.ObjectId) {
		const user = await this.userModel.findById(userId).select('inventory');
		if (!user) throw new NotFoundException();

		return user.inventory || {};
	}

	async consumeInventory(userId: Types.ObjectId, actionName: string, amount: number = 1, session?: ClientSession) {
		const updatedUser = await this.userModel.findOneAndUpdate(
			{
				_id: userId,
				[`inventory.${actionName}`]: { $gte: amount },
			},
			{
				$inc: { [`inventory.${actionName}`]: -amount },
			},
			{ new: true, session },
		);
		if (!updatedUser) {
			const user = await this.userModel.findById(userId).session(session || null);
			if (!user) throw new NotFoundException();
			throw new BadRequestException();
		}

		return updatedUser.inventory!;
	}

	async hasInventory(userId: Types.ObjectId, actionName: string, amount: number = 1) {
		const inventory = await this.getInventory(userId);
		const currentAmount = inventory[actionName] ?? 0;
		return currentAmount >= amount;
	}

	async addInventory(userId: Types.ObjectId, actionName: string, amount: number = 1, session?: ClientSession) {
		const updatedUser = await this.userModel.findByIdAndUpdate(
			userId,
			{
				$inc: { [`inventory.${actionName}`]: amount },
			},
			{ new: true, session },
		);
		if (!updatedUser) throw new NotFoundException();

		return updatedUser;
	}

	async applyRewards(
		userId: Types.ObjectId,
		rewards: {
			food: Array<{ name: string; quantity: number }>;
			drinks: Array<{ name: string; quantity: number }>;
			hygiene: Array<{ name: string; quantity: number }>;
			care: Array<{ name: string; quantity: number }>;
			eggs: number;
			valentines?: Array<{ name: string; quantity: number }>;
		},
		session?: ClientSession,
	) {
		for (const item of rewards.food) {
			await this.addInventory(userId, item.name, item.quantity, session);
		}
		for (const item of rewards.drinks) {
			await this.addInventory(userId, item.name, item.quantity, session);
		}
		for (const item of rewards.hygiene) {
			await this.addInventory(userId, item.name, item.quantity, session);
		}
		for (const item of rewards.care) {
			await this.addInventory(userId, item.name, item.quantity, session);
		}
		if (rewards.eggs > 0) {
			await this.addInventory(userId, EGG_ITEM_NAME, rewards.eggs, session);
		}
		if (rewards.valentines) {
			for (const item of rewards.valentines) {
				await this.addInventory(userId, item.name, item.quantity, session);
			}
		}
	}
}
