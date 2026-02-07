import { Database } from "../database";

export interface UserData {
	picture?: string;
	name: string;
	email: string;
	password: string;
}

export type User = UserData & Database;