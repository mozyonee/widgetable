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
			await session.withTransaction(async () => {
				result = await callback(session);
			});
			return result!;
		} finally {
			await session.endSession();
		}
	}
}
