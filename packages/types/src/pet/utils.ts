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
