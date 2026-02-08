import { Database } from "../database";

export enum FriendshipStatus {
	NONE = "none",
	SENT = "sent",
	RECEIVED = "received",
	FRIENDS = "friends",
}

export enum RequestDirection {
	SENT = "sent",
	RECEIVED = "received",
}

export interface UserData {
	picture?: string;
	name: string;
	email: string;
	password: string;
}

export type User = UserData & Database;