import { BadRequestException, Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
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
		const defaultName = email.split('@')[0];
		const newUser = new this.userModel({
			email,
			password: hashedPassword,
			name: defaultName,
		});
		return newUser.save();
	}

	async getImage(userId: string) {
		const user = await this.userModel.findById(userId);
		if (!user || !user.picture) throw new NotFoundException();

		const s3Response = await this.s3Client.getObject(StorageBucket.AVATARS, user.picture);
		if (!s3Response) throw new NotFoundException();

		return new StreamableFile(s3Response, {
			type: 'image/jpeg',
		});
	}

	async setImage(userId: string, file: Express.Multer.File): Promise<UserDocument> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

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

		if (!updatedUser) throw new NotFoundException();
		if (oldPicture) void this.s3Client.removeObject(StorageBucket.AVATARS, oldPicture);

		return updatedUser;
	}

	async updateName(userId: string, name: string): Promise<UserDocument> {
		const user = await this.userModel.findByIdAndUpdate(userId, { name }, { new: true });
		if (!user) throw new NotFoundException();
		return user;
	}

	async searchUsers(query: string): Promise<Partial<UserDocument>[]> {
		const users = await this.userModel
			.find({
				$or: [
					{ name: { $regex: query, $options: 'i' } },
					{ email: { $regex: query, $options: 'i' } }
				]
			})
			.select('_id name email picture')
			.limit(20)
			.exec();

		return users;
	}

	async getFriends(userId: string): Promise<Partial<UserDocument>[]> {
		const user = await this.userModel
			.findById(userId)
			.populate('friends', '_id name email picture')
			.exec();

		if (!user) throw new NotFoundException();

		return user.friends as unknown as Partial<UserDocument>[];
	}

	async getFriendRequests(userId: string) {
		const user = await this.userModel
			.findById(userId)
			.populate('friendRequestsReceived', '_id name email picture')
			.populate('friendRequestsSent', '_id name email picture')
			.exec();

		if (!user) throw new NotFoundException();

		return {
			received: user.friendRequestsReceived as unknown as Partial<UserDocument>[],
			sent: user.friendRequestsSent as unknown as Partial<UserDocument>[],
		};
	}

	async sendFriendRequest(userId: string, friendId: string): Promise<UserDocument> {
		if (userId === friendId) throw new BadRequestException();

		const friend = await this.userModel.findById(friendId);
		if (!friend) throw new NotFoundException();

		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		if (user.friends?.some(id => id.toString() === friendId)) {
			throw new BadRequestException();
		}

		if (user.friendRequestsSent?.some(id => id.toString() === friendId)) {
			throw new BadRequestException();
		}

		if (user.friendRequestsReceived?.some(id => id.toString() === friendId)) {
			throw new BadRequestException();
		}

		await this.userModel.findByIdAndUpdate(userId, {
			$addToSet: { friendRequestsSent: friendId }
		});

		await this.userModel.findByIdAndUpdate(friendId, {
			$addToSet: { friendRequestsReceived: userId }
		});

		const updatedUser = await this.userModel
			.findById(userId)
			.populate('friendRequestsSent', '_id name email picture')
			.exec();

		if (!updatedUser) throw new NotFoundException();
		return updatedUser;
	}

	async acceptFriendRequest(userId: string, friendId: string): Promise<UserDocument> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		if (!user.friendRequestsReceived?.some(id => id.toString() === friendId)) {
			throw new BadRequestException();
		}

		await this.userModel.findByIdAndUpdate(userId, {
			$pull: { friendRequestsReceived: friendId },
			$addToSet: { friends: friendId }
		});

		await this.userModel.findByIdAndUpdate(friendId, {
			$pull: { friendRequestsSent: userId },
			$addToSet: { friends: userId }
		});

		const updatedUser = await this.userModel
			.findById(userId)
			.populate('friends', '_id name email picture')
			.populate('friendRequestsReceived', '_id name email picture')
			.exec();

		if (!updatedUser) throw new NotFoundException();
		return updatedUser;
	}

	async declineFriendRequest(userId: string, friendId: string): Promise<UserDocument> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		if (!user.friendRequestsReceived?.some(id => id.toString() === friendId)) {
			throw new BadRequestException();
		}

		await this.userModel.findByIdAndUpdate(userId, {
			$pull: { friendRequestsReceived: friendId }
		});

		await this.userModel.findByIdAndUpdate(friendId, {
			$pull: { friendRequestsSent: userId }
		});

		const updatedUser = await this.userModel
			.findById(userId)
			.populate('friendRequestsReceived', '_id name email picture')
			.exec();

		if (!updatedUser) throw new NotFoundException();
		return updatedUser;
	}

	async cancelFriendRequest(userId: string, friendId: string): Promise<UserDocument> {
		const user = await this.userModel.findById(userId);
		if (!user) throw new NotFoundException();

		if (!user.friendRequestsSent?.some(id => id.toString() === friendId)) {
			throw new BadRequestException();
		}

		await this.userModel.findByIdAndUpdate(userId, {
			$pull: { friendRequestsSent: friendId }
		});

		await this.userModel.findByIdAndUpdate(friendId, {
			$pull: { friendRequestsReceived: userId }
		});

		const updatedUser = await this.userModel
			.findById(userId)
			.populate('friendRequestsSent', '_id name email picture')
			.exec();

		if (!updatedUser) throw new NotFoundException();
		return updatedUser;
	}

	async removeFriend(userId: string, friendId: string): Promise<UserDocument> {
		await this.userModel.findByIdAndUpdate(userId, {
			$pull: { friends: friendId }
		});

		await this.userModel.findByIdAndUpdate(friendId, {
			$pull: { friends: userId }
		});

		const user = await this.userModel
			.findById(userId)
			.populate('friends', '_id name email picture')
			.exec();

		if (!user) throw new NotFoundException();
		return user;
	}
}
