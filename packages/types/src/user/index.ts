import { Database } from "../database";
import { UserInventory } from "../pet";

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
	_id?: string;
	picture?: string;
	name: string;
	email: string;
	password: string;
	inventory?: UserInventory;
}

export type User = UserData & Database;