import { Database } from "../database";
import { PetData } from "../pet";
import { UserData } from "../user";

export enum RequestType {
	FRIEND_REQUEST = 'FRIEND_REQUEST',
	COPARENTING_REQUEST = 'COPARENTING_REQUEST',
}

export enum RequestStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED',
	DECLINED = 'DECLINED',
	CANCELLED = 'CANCELLED',
}

export interface RequestMetadata {
	petId?: string;
	pet?: PetData & Database;
	[key: string]: any;
}

export interface RequestData {
	_id?: string;
	type: RequestType;
	senderId: string;
	recipientId: string;
	status: RequestStatus;
	metadata: RequestMetadata;
	sender?: UserData & Database;
	recipient?: UserData & Database;
}

export type Request = RequestData & Database;
