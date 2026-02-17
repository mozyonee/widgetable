export const en: Record<string, string>;
export const ru: Record<string, string>;
export const locales: {
	en: Record<string, string>;
	ru: Record<string, string>;
};

export function translate(
	language: string,
	key: string,
	params?: Record<string, string | number>
): string;
