import { Global, Module } from '@nestjs/common';
import { Client } from 'minio';
import { STORAGE_CLIENT, StorageConfig } from './storage.config';
import { StorageService } from './storage.service';

@Global()
@Module({
	providers: [
		StorageConfig,
		{
			provide: STORAGE_CLIENT,
			useFactory: (StorageConfig: StorageConfig) => {
				return new Client(StorageConfig.options);
			},
			inject: [StorageConfig],
		},
		StorageService,
	],
	exports: [StorageService, StorageConfig, STORAGE_CLIENT],
})
export class StorageModule {}
