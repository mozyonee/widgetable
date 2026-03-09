import { PET_NEED_KEYS, PET_NEEDS_CONFIG } from './config';
import { PET_UPDATE_INTERVAL } from './constants';
import { PetNeeds } from './types';

export const calculateDecayedNeeds = (
	needs: PetNeeds,
	lastUpdatedAt: Date,
	now: Date,
): { needs: PetNeeds; changed: boolean; intervals: number } => {
	const timeDiff = now.getTime() - lastUpdatedAt.getTime();
	const intervals = Math.floor(timeDiff / PET_UPDATE_INTERVAL);

	if (intervals <= 0) return { needs, changed: false, intervals: 0 };

	const updated = { ...needs };
	for (const key of PET_NEED_KEYS) {
		const decrease = (intervals * PET_UPDATE_INTERVAL * 100) / PET_NEEDS_CONFIG[key].decayDuration;
		updated[key] = Math.max(0, Math.min(100, needs[key] - decrease));
	}

	return { needs: updated, changed: true, intervals };
};

const BASE_EXP = 50;
const EXP_MULTIPLIER = 1.5;

export const calculateLevel = (experience: number): number => {
	let level = 1;
	let expNeeded = BASE_EXP;
	let totalExpForLevel = 0;

	while (experience >= totalExpForLevel + expNeeded) {
		totalExpForLevel += expNeeded;
		level++;
		expNeeded = Math.floor(BASE_EXP * Math.pow(level, EXP_MULTIPLIER));
	}

	return level;
};

export const getExpForNextLevel = (level: number): number => {
	if (level === 1) return BASE_EXP;
	return Math.floor(BASE_EXP * Math.pow(level, EXP_MULTIPLIER));
};

export const getExpForCurrentLevel = (level: number): number => {
	if (level === 1) return 0;

	let totalExp = BASE_EXP;
	for (let i = 2; i < level; i++) {
		totalExp += Math.floor(BASE_EXP * Math.pow(i, EXP_MULTIPLIER));
	}
	return totalExp;
};
