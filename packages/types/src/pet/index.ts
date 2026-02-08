import { Database } from "../database";

export enum PetType {
	FOX = 'fox',
	// CAT = 'cat',
	// DOG = 'dog',
	// RABBIT = 'rabbit',
}

export enum PetActionCategory {
	FEED = 'Feed',
	DRINK = 'Drink',
	WASH = 'Wash',
	CARE = 'Care',
}

export enum PetAnimation {
	EAT = 'eat',
	DRINK = 'drink',
	TOILET = 'toilet',
	BATH = 'bath',
	SLEEP = 'sleep',
}

export interface PetNeeds {
	hunger: number;
	thirst: number;
	energy: number;
	hygiene: number;
	toilet: number;
}

export interface PetData {
	type: PetType;
	name: string;
	parents: string[];
	needs: PetNeeds;
}

export interface PetUpdate {
	type?: PetType;
	name?: string;
	parents?: string[];
	needs?: Partial<PetNeeds>;
}

export type Pet = PetData & Database;