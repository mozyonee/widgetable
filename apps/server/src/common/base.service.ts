import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class BaseService {
	constructor(@InjectConnection() protected readonly connection: Connection) {}

	protected async withTransaction<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
		const session = await this.connection.startSession();
		try {
			let result: T;
			try {
				await session.withTransaction(async () => {
					result = await callback(session);
				});
			} catch (err: any) {
				if (err?.code === 20 || err?.codeName === 'IllegalOperation') {
					result = await callback(session);
				} else {
					throw err;
				}
			}
			return result!;
		} finally {
			await session.endSession();
		}
	}
}
