import { Inject, Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { STORAGE_CLIENT, StorageBucket, StorageConfig } from './storage.config';

@Injectable()
export class StorageService {
	constructor(
		@Inject(STORAGE_CLIENT) private readonly s3Client: Minio.Client,
		private readonly storageConfig: StorageConfig,
	) {}

	async onModuleInit() {
		const buckets = Object.values(StorageBucket);

		for (const bucket of buckets) {
			const exists = await this.s3Client.bucketExists(bucket);

			if (!exists) await this.s3Client.makeBucket(bucket, this.storageConfig.options.region);
		}
	}
}
