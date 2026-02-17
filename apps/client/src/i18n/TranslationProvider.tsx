'use client';

import api from '@/lib/api';
import { useAppSelector } from '@/store';
import { translate } from '@widgetable/i18n';
import { DEFAULT_LANGUAGE, Language } from '@widgetable/types';
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';

const LANGUAGE_STORAGE_KEY = 'widgetable_language';

export interface TranslationContextValue {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string, params?: Record<string, string | number>) => string;
}

export const TranslationContext = createContext<TranslationContextValue>({
	language: DEFAULT_LANGUAGE,
	setLanguage: () => {},
	t: (key) => key,
});

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
	const userData = useAppSelector((state) => state.user.userData);

	const [language, setLanguageState] = useState<Language>(() => {
		if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
		return (localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language) || DEFAULT_LANGUAGE;
	});

	useEffect(() => {
		if (userData?.language) {
			setLanguageState(userData.language as Language);
			localStorage.setItem(LANGUAGE_STORAGE_KEY, userData.language);
		}
	}, [userData?.language]);

	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);

	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
		api.patch('/users/language', { language: lang }).catch(() => {});
	}, []);

	const t = useCallback(
		(key: string, params?: Record<string, string | number>) => translate(language, key, params),
		[language],
	);

	return <TranslationContext.Provider value={{ language, setLanguage, t }}>{children}</TranslationContext.Provider>;
};
