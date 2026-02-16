import { DEFAULT_LANGUAGE, LANGUAGES, Language } from '@widgetable/types';
import en from './locales/en.json';
import ru from './locales/ru.json';

export type { Language };
export { DEFAULT_LANGUAGE, LANGUAGES };

const translations: Record<Language, Record<string, string>> = { en, ru };

export type TranslationKey = keyof typeof en;
export type TFunction = (key: string, params?: Record<string, string | number>) => string;

export function translate(
	language: Language,
	key: string,
	params?: Record<string, string | number>,
): string {
	let text = translations[language]?.[key]
		?? translations[DEFAULT_LANGUAGE]?.[key]
		?? key;

	if (params) {
		for (const [param, value] of Object.entries(params)) {
			text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
		}
	}

	return text;
}
