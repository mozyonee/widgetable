# @widgetable/i18n

Shared translation system used by both `apps/client` and `apps/server`. Pure JavaScript — no build step required.

## Usage

```typescript
import { translate } from '@widgetable/i18n';

translate('en', 'pets.type.cat');              // "Cat"
translate('en', 'pets.level', { level: 5 });   // "Level: 5"
```

Falls back to English when a key is missing in the requested locale, and returns the key itself if not found in either.

## Exports

| Export | Description |
|--------|-------------|
| `translate(language, key, params?)` | Returns the translated string; `params` replaces `{name}` placeholders |
| `locales` | Object containing all locale maps (`{ en, ru }`) |
| `en` | English locale map |
| `ru` | Russian locale map |

## Adding translations

Add a key to both `locales/en.json` and `locales/ru.json`. Use `{paramName}` placeholders for dynamic values:

```json
{ "pets.level": "Level: {level}" }
```
