import { Types } from 'mongoose';

export interface Database {
	_id: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}
