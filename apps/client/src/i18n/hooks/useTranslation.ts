'use client';

import { useContext } from 'react';
import { TranslationContext, TranslationContextValue } from '../TranslationProvider';

export const useTranslation = (): TranslationContextValue => {
	return useContext(TranslationContext);
};
