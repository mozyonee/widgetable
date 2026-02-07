import { Database } from "../database";

export enum PetType {
	FOX = 'fox',
	// CAT = 'cat',
	// DOG = 'dog',
	// RABBIT = 'rabbit',
}

export enum PetAnimation {
	EAT = 'eat',
	DRINK = 'drink',
	TOILET = 'toilet',
	BATH = 'bath',
	SLEEP = 'sleep',
}

export interface PetData {
	type: PetType;
	name: string;
	parents: string[];
	hunger: number;
	thirst: number;
	energy: number;
	hygiene: number;
	toilet: number;
}

export type Pet = PetData & Database;