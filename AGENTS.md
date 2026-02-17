# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Layout

Widgetable is a virtual-pet web app. The repo uses npm workspaces — cross-package scripts can be run from the root.

| Directory | Role | Port | Docs |
|-----------|------|------|------|
| `apps/client/` | Next.js 16 frontend (React 19) | 3000 | [README](apps/client/README.md) |
| `apps/server/` | NestJS 11 backend | 3001 | [README](apps/server/README.md) |
| `packages/types/` | Shared TypeScript types & constants | — | [README](packages/types/README.md) |
| `packages/i18n/` | Shared translation system | — | [README](packages/i18n/README.md) |

Both apps use **tabs** for indentation, `tabWidth: 4`, and `printWidth: 120` (Prettier).

## Root Commands

```bash
npm run dev:client       # start client dev server
npm run dev:server       # start server dev server
npm run build            # build all (types → client → server)
npm run build:types      # build @widgetable/types only
npm run tsc              # type-check client and server
npm run format           # format client and server
```

> **Build order:** `@widgetable/types` must be built before the apps. Root `build:client` / `build:server` scripts handle this automatically; run `npm run build:types` manually when changing types during development.

## Architecture & Key Design Decisions

### Shared packages

`@widgetable/types` exports all shared TypeScript types, enums, and constants. Import from it rather than duplicating definitions:

```typescript
import { Pet, PetType, PET_THRESHOLDS } from '@widgetable/types';
```

`@widgetable/i18n` provides `translate(locale, key, params?)` — used on both client and server, no build step required.

### Authentication flow

JWT is issued as an HTTP-only cookie named `Authentication` by `POST /auth/login`. The client sends it automatically via Axios (`withCredentials: true`). The Passport JWT strategy (`server/src/auth/strategies/jwt.strategy.ts`) extracts it on the server. `AuthRoute` on the client calls `checkAuth` on every route change and redirects unauthenticated users to `/auth` unless the route is in `PUBLIC_ROUTES`.

### Client state

Redux Toolkit + redux-persist. Single slice: `userSlice` (auth status + user data), persisted via a custom storage adapter at `src/store/storage.ts`. Always use the typed hooks from `src/store/index.ts` — do not import raw `useDispatch`/`useSelector`. `PetContext` is a plain React context for passing the currently-selected pet within a page; it is not persisted.

### Client API layer

Single Axios instance from `client/src/lib/api.ts` with `baseURL` from `NEXT_PUBLIC_SERVER_URL`. All API calls go through this instance. Use `callError` from `client/src/lib/functions.tsx` for error toasts.

### Pet stats degradation

Pet stats are **not** updated on a real-time timer. `calculateCurrentStats` in `PetsService` computes decay retroactively on every pet fetch, based on elapsed time since `updatedAt` in 5-second intervals, then persists the result back to MongoDB.

### File uploads

Multer (configured globally in `AppModule`) writes to the OS temp directory with a UUID filename. `UsersService` streams the temp file into MinIO via `StorageService`, then deletes the local file.

### CORS

Only local/private-network origins are allowed (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16–31.x.x). Enforced by a custom origin callback in `server/src/main.ts`.

## Environment

Both `.env` files are gitignored. Copy the `.env.example` in each app to get started.

- **`apps/client/.env.local`** — `NEXT_PUBLIC_SERVER_URL`
- **`apps/server/.env`** — `MONGODB_URI`, `JWT_SECRET`, `STORAGE_ENDPOINT`, `STORAGE_PORT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `CLIENT_URL`

## Path Aliases

- **Client:** `@/*` → `src/*` (configured in `apps/client/tsconfig.json`)
- **Server:** bare `src/…` imports resolved by `tsconfig-paths` at test time; NestJS CLI handles them at build time
