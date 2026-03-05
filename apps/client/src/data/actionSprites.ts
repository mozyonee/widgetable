export const ACTION_SPRITES: Record<string, string> = {
	// Feed Actions
	sushi: 'food/food/sushi_rolls.png',
	hamburger: 'food/food/hamburger.png',
	pizza: 'food/food/pizza_slice.png',
	chocolateBar: 'food/food/chocolate_bar.png',
	cookie: 'food/desserts/chocolate_chip_cookies.png',
	donut: 'food/desserts/glazed_donut.png',
	watermelon: 'food/fruits/watermelon_slice.png',
	mango: 'food/fruits/mango.png',
	strawberry: 'food/plants/strawberry.png',

	// Drink Actions
	orangeJuice: 'food/desserts/orange_juice.png',
	fruitTea: 'food/desserts/tea_cup.png',
	appleCider: 'food/desserts/apple_cider_mug.png',
	latte: 'food/desserts/latte.png',
	hotCocoa: 'food/desserts/cocoa_mug.png',
	milk: 'food/food/milk_carton.png',

	// Wash Actions
	bathtub: 'bathroom/bathtub.png',
	shower: 'bathroom/shower_stall.png',
	handSoap: 'bathroom/hand_soap_pump.png',
	brush: 'bathroom/toothbrush.png',
	earCleaning: 'bathroom/cotton_swab_jar.png',
	nailTrim: 'bathroom/nail_file.png',

	// Care Actions
	toilet: 'bathroom/toilet.png',
	quickPotty: 'bathroom/toilet_paper_roll.png',
	longSleep: 'bedroom/blue_bed_horizontal.png',
	nap: 'bedroom/white_pillow.png',
	rest: 'bedroom/folded_blanket.png',

	// Valentine Items - Chocolates
	chocolateBarBrown: '/valentine/chocolate_bar_brown.png',
	chocolateBarBlue: '/valentine/chocolate_bar_blue.png',
	chocolateBarWhite: '/valentine/chocolate_bar_white.png',
	chocolateBarDuo: '/valentine/chocolate_bar_red_blue.png',
	chocolate: '/valentine/chocolate.png',

	// Valentine Items - Letters & Envelopes
	letterSealedRedHeart: '/valentine/letter_sealed_red_heart.png',
	letterSealedRedBorder: '/valentine/letter_sealed_red_border.png',
	letterSealedPink: '/valentine/letter_sealed_pink.png',
	letterSealedSmallHeart: '/valentine/letter_sealed_small_heart.png',
	letterSealedOrange: '/valentine/letter_sealed_orange.png',
	letterSealedPinkHeart: '/valentine/letter_sealed_pink_heart.png',
	letterSealedBrown: '/valentine/letter_sealed_brown.png',
	letterSealedAmber: '/valentine/letter_sealed_amber.png',
	envelopeWhite: '/valentine/envelope_white.png',
	envelopePink: '/valentine/envelope_pink.png',
};

export const getActionSprite = (actionName: string): string | undefined => {
	const sprite = ACTION_SPRITES[actionName];
	if (!sprite) return undefined;
	return sprite.startsWith('/') ? sprite : `/assets_new/${sprite}`;
};
