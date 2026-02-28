import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';

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
			} catch (err: unknown) {
				const e = err as { code?: number; codeName?: string };
				if (e?.code === 20 || e?.codeName === 'IllegalOperation') {
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
