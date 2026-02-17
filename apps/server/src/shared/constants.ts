import { LANGUAGES } from '@widgetable/types';

export const USER_POPULATE_FIELDS = '_id name email picture' as const;

export const SUPPORTED_LANGUAGES = LANGUAGES.map((l) => l.code);

export const PET_CONFIG = {
	MAX_EXPEDITION_SLOTS_RATIO: 0.3,
} as const;

export const WEBPUSH_CONFIG = {
	INVALID_SUBSCRIPTION_CODES: [410, 404],
	PRESIGNED_URL_EXPIRY_SECONDS: 3600,
} as const;
