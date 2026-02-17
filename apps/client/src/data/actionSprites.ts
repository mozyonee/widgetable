export const ACTION_SPRITES: Record<string, string> = {
	// Feed Actions
	Sushi: 'food/food/sushi_rolls.png',
	Hamburger: 'food/food/hamburger.png',
	Lasagna: 'food/food/lasagna.png',
	'Bento Box': 'food/food/bento_box.png',
	Pizza: 'food/food/pizza_slice.png',
	Ramen: 'food/food/ramen_bowl.png',
	Taco: 'food/food/taco.png',
	Burrito: 'food/food/burrito.png',
	Sandwich: 'food/food/sandwich.png',
	'Hot Dog': 'food/food/hot_dog.png',
	Soup: 'food/food/tomato_soup_bowl.png',
	'Rice Bowl': 'food/food/rice_bowl.png',
	'Mac & Cheese': 'food/food/mac_and_cheese_bowl.png',
	Watermelon: 'food/fruits/watermelon_slice.png',
	Mango: 'food/fruits/mango.png',
	Strawberry: 'food/plants/strawberry.png',
	Cookie: 'food/desserts/chocolate_chip_cookies.png',
	Brownie: 'food/desserts/brownie.png',
	Donut: 'food/desserts/glazed_donut.png',
	'French Fries': 'food/food/french_fries.png',

	// Drink Actions
	'Orange Juice': 'food/desserts/orange_juice.png',
	'Apple Cider': 'food/desserts/apple_cider_mug.png',
	'Fruit Parfait': 'food/food/fruit_parfait_cup.png',
	Latte: 'food/desserts/latte.png',
	Milk: 'food/food/milk_carton.png',
	'Hot Cocoa': 'food/desserts/cocoa_mug.png',
	'Fruit Tea': 'food/desserts/tea_cup.png',
	Cappuccino: 'food/desserts/cappuccino_mug.png',

	// Wash Actions
	'Bath Salts': 'bathroom/bath_salts_jar.png',
	Bathtub: 'bathroom/bathtub.png',
	Shampoo: 'bathroom/shampoo_bottle.png',
	Shower: 'bathroom/shower_stall.png',
	'Mouth Wash': 'bathroom/mouth_wash_bottle.png',
	'Hand Soap': 'bathroom/hand_soap_pump.png',
	Brush: 'bathroom/toothbrush.png',
	'Wipe Down': 'bathroom/bath_sponge.png',
	Sponge: 'bathroom/natural_sponge.png',

	// Valentine Items - Chocolates
	'Chocolate Bar Red': '/valentine/chocolate_bar_red.png',
	'Chocolate Bar Brown': '/valentine/chocolate_bar_brown.png',
	'Chocolate Bar Blue': '/valentine/chocolate_bar_blue.png',
	'Chocolate Bar White': '/valentine/chocolate_bar_white.png',
	'Chocolate Bar Duo': '/valentine/chocolate_bar_red_blue.png',
	Chocolate: '/valentine/chocolate.png',

	// Valentine Items - Letters & Envelopes
	'Letter Sealed Red Heart': '/valentine/letter_sealed_red_heart.png',
	'Letter Sealed Red Border': '/valentine/letter_sealed_red_border.png',
	'Letter Sealed Pink': '/valentine/letter_sealed_pink.png',
	'Letter Sealed Small Heart': '/valentine/letter_sealed_small_heart.png',
	'Letter Sealed Orange': '/valentine/letter_sealed_orange.png',
	'Letter Sealed Pink Heart': '/valentine/letter_sealed_pink_heart.png',
	'Letter Sealed Brown': '/valentine/letter_sealed_brown.png',
	'Letter Sealed Amber': '/valentine/letter_sealed_amber.png',
	'Envelope White': '/valentine/envelope_white.png',
	'Envelope Pink': '/valentine/envelope_pink.png',

	// Care Actions
	Toilet: 'bathroom/toilet.png',
	'Quick Potty': 'bathroom/toilet_paper_roll.png',
	'Long Sleep': 'bedroom/blue_bed_horizontal.png',
	Nap: 'bedroom/white_pillow.png',
	Rest: 'bedroom/folded_blanket.png',
	'Grooming Session': 'bathroom/hair_brush.png',
	'Nail Trim': 'bathroom/nail_file.png',
	'Ear Cleaning': 'bathroom/cotton_swab_jar.png',
};

export const getActionSprite = (actionName: string): string | undefined => {
	const sprite = ACTION_SPRITES[actionName];
	if (!sprite) return undefined;
	return sprite.startsWith('/') ? sprite : `/assets_new/${sprite}`;
};
