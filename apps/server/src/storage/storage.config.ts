import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientOptions } from 'minio';

export const STORAGE_CLIENT = 'STORAGE_CLIENT';

export enum StorageBucket {
	AVATARS = 'creonix-previews',
}

@Injectable()
export class StorageConfig {
	constructor(private readonly configService: ConfigService) {}

	get options(): ClientOptions {
		const port = parseInt(this.configService.get('STORAGE_PORT', '9000'));
		const useSSL = port === 443;

		return {
			region: this.configService.get('STORAGE_REGION'),
			endPoint: this.configService.getOrThrow('STORAGE_ENDPOINT'),
			useSSL,
			port,
			accessKey: this.configService.getOrThrow('STORAGE_ACCESS_KEY'),
			secretKey: this.configService.getOrThrow('STORAGE_SECRET_KEY'),
		};
	}
}

export const PRESIGNED_URL_EXPIRY_SECONDS = 3600;
