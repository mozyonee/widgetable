const en = require('./locales/en.json');
const ru = require('./locales/ru.json');

const locales = { en, ru };
const DEFAULT_LANGUAGE = 'en';

function translate(language, key, params) {
	let text = locales[language]?.[key] ?? locales[DEFAULT_LANGUAGE]?.[key] ?? key;

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
