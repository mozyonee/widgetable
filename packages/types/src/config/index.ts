// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export const LANGUAGES = [
	{ code: 'en', nativeLabel: 'English' },
	{ code: 'ru', nativeLabel: 'Русский' },
] as const;

export type Language = typeof LANGUAGES[number]['code'];
export const DEFAULT_LANGUAGE: Language = LANGUAGES[0].code;
