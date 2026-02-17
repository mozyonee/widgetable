# Shared Packages

This directory contains shared packages used across the monorepo.

## Packages

### `@widgetable/types`

TypeScript type definitions and constants shared between client and server.

**Structure:**
- `src/claims/` - Claim-related types (ClaimResult, ClaimStatus)
- `src/config/` - Configuration constants (thresholds, timings)
- `src/database/` - Database-related types
- `src/pet/` - Pet-related types, enums, and constants
  - `actions.ts` - Pet actions organized by category
  - `config.ts` - Pet configuration (animation durations, needs config, scales)
  - `constants.ts` - Pet constants (update interval, expedition settings)
  - `enums.ts` - Pet enums (PetType, PetNeed, PetAnimation, etc.)
  - `sprites.ts` - Type-safe pet sprite configurations
  - `types.ts` - Pet interface definitions
  - `utils.ts` - Pet utility functions (level calculations)
  - `valentine.ts` - Valentine gift items
- `src/request/` - Request-related types
- `src/rewards/` - Reward system types and constants
- `src/user/` - User-related types

**Build:**
```bash
npm run build:types
```

Outputs compiled JavaScript and type definitions to `dist/`.

**Usage:**
```typescript
import { Pet, PetType, PET_THRESHOLDS } from '@widgetable/types';
```

### `@widgetable/i18n`

Translation system shared between client and server.

**Structure:**
- `locales/en.json` - English translations
- `locales/ru.json` - Russian translations
- `index.js` - Main entry point with `translate()` function
- `index.d.ts` - TypeScript definitions

**Usage:**
```typescript
import { translate } from '@widgetable/i18n';

const text = translate('en', 'pets.type.cat'); // "Cat"
const withParams = translate('en', 'pets.level', { level: 5 }); // "Level: 5"
```

**No build step required** - pure JavaScript package.

## Adding a New Shared Package

1. Create package directory: `packages/your-package/`
2. Add `package.json` with package name `@widgetable/your-package`
3. Update root `package.json` workspaces array
4. Run `npm install` from root
5. Import in apps: `import { ... } from '@widgetable/your-package'`

## Guidelines

### What to Share

- Type definitions used by both client and server
- Constants referenced in multiple apps
- Utility functions needed across apps
- Translation files

### What NOT to Share

- UI components (client-specific)
- API routes (server-specific)
- Database models (server-specific)
- Asset paths (client-specific)
- Environment-specific configuration

### When to Create a New Package

Consider creating a new shared package when:
- Multiple apps need the same functionality
- Code is being duplicated across apps
- A clear domain boundary exists (types, i18n, validation, etc.)

Avoid creating packages for:
- Single-use code
- App-specific business logic
- Premature abstractions
