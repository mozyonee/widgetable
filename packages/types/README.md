# @widgetable/types

Shared TypeScript types, enums, and constants used by both `apps/client` and `apps/server`.

## Commands

```bash
npm run build        # tsc -b → outputs to dist/
npm run typecheck    # TypeScript check without emitting
```

Must be built before either app. The root `build:client` and `build:server` scripts do this automatically. If you change types during development, rebuild manually:

```bash
# from repo root
npm run build:types
```

## Usage

```typescript
import { Pet, PetType, PetNeed, PET_THRESHOLDS } from '@widgetable/types';
```

## Structure

```
src/
├── claims/      # ClaimResult, ClaimStatus
├── config/      # Threshold and timing constants
├── database/    # Database-related types
├── pet/
│   ├── actions.ts   # Pet actions by category
│   ├── config.ts    # Animation durations, needs config, scales
│   ├── constants.ts # Update interval, expedition settings
│   ├── enums.ts     # PetType, PetNeed, PetAnimation, …
│   ├── sprites.ts   # Type-safe sprite configurations
│   ├── types.ts     # Pet interface definitions
│   └── utils.ts     # Level calculation utilities
├── request/     # Friend request types
├── rewards/     # Reward system types and constants
└── user/        # User types and enums
```
