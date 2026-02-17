export const HTTP_STATUS = {
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
} as const;

export const ICON_SIZES = {
	XS: 12,
	SM: 16,
	MD: 20,
	LG: 24,
	XL: 28,
	XXL: 35,
} as const;

export const PET_SPRITE_SIZES = {
	SMALL: 48,
	MEDIUM: 64,
	LARGE: 100,
	DEFAULT_HEIGHT: 500,
	DEFAULT_WIDTH: 200,
} as const;
