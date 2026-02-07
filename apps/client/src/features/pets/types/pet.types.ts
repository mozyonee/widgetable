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

export interface IPet {
	type: PetType;
	name: string;
	parents: string[];
	hunger: number;
	thirst: number;
	energy: number;
	hygiene: number;
	toilet: number;
}

export interface IPetDocument extends IPet {
	_id: string;
	createdAt?: Date;
	updatedAt?: Date;
}
