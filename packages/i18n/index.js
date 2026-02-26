const en = require('./locales/en.json');
const ru = require('./locales/ru.json');

const locales = { en, ru };
const DEFAULT_LANGUAGE = 'en';

function resolve(obj, key) {
	const parts = key.split('.');
	let current = obj;
	for (const part of parts) {
		if (current == null || typeof current !== 'object') return undefined;
		current = current[part];
	}
	return typeof current === 'string' ? current : undefined;
}

function translate(language, key, params) {
	let text = resolve(locales[language], key) ?? resolve(locales[DEFAULT_LANGUAGE], key) ?? key;

	if (params) {
		for (const [param, value] of Object.entries(params)) {
			text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
		}
	}

	return text;
}

module.exports = {
	en,
	ru,
	locales,
	translate,
};
