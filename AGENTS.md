# CLAUDE.md

This file provides guidance to AI Agents when working with code in this repository.

## Monorepo Layout

Widgetable is a virtual-pet web app split into two independent projects (`apps/client` and `apps/server`) and shared packages (`packages/*`). The repo uses npm workspaces (root `package.json`) — you can run cross-package scripts from the monorepo root.

| Directory | Role | Port |
|-----------|------|------|
| `apps/client/` | Next.js 16 frontend (React 19) | 3000 |
| `apps/server/` | NestJS 11 backend | 3001 |

Both projects use **tabs** for indentation, `tabWidth: 4`, and `printWidth: 120` (Prettier).

## Commands

### Client (`apps/client/`)

```bash
npm run dev          # dev server (webpack mode, binds 0.0.0.0:3000)
npm run build        # production build (webpack mode)
npm run lint         # ESLint via next lint
npm run format       # Prettier over src/**/*.{ts,tsx}
```

### Server (`apps/server/`)

```bash
npm run start:dev    # watch-mode dev server
npm run build        # nest build → dist/
npm run start:prod   # node dist/main (production)
npm run lint         # ESLint --fix over src & test
npm run format       # Prettier over src & test
npm run test         # Jest unit tests (*.spec.ts in src/)
npm run test:watch   # Jest in watch mode
npm run test:cov     # Jest with coverage report
npm run test:e2e     # Jest with test/jest-e2e.json config
```

## Architecture & Key Design Decisions

### Authentication flow
JWT is issued as an HTTP-only cookie named `Authentication` by the server's `POST /auth/login`. The client sends it automatically via `axios` (`withCredentials: true`). The server extracts it with Passport's JWT strategy (`server/src/auth/strategies/jwt.strategy.ts`). On the client side, `AuthRoute` (wraps the entire app in the root layout) calls `checkAuth` on every route change — if the user is not authenticated and the route is not `/auth`, it redirects to `/auth`.

### Client state
- **Redux Toolkit + redux-persist** manages global state. Only one slice currently: `userSlice` (auth status + user data). The store is persisted to a custom storage adapter (`client/src/store/storage.ts`).
- Use the typed hooks `useAppDispatch` / `useAppSelector` exported from `client/src/store/index.ts` — do not import raw `useDispatch`/`useSelector`.
- `PetContext` (`client/src/features/pets/context/PetContext.tsx`) is a plain React context used only to pass the currently-selected pet down the component tree within a single page; it is not persisted.

### Client API layer
A single Axios instance is exported from `client/src/lib/api.ts` with `baseURL` set from `NEXT_PUBLIC_SERVER_URL`. All API calls should go through this instance. Error handling is done with `callError` from `client/src/lib/functions.tsx`, which shows a toast via `react-hot-toast`.

### Client routing
App Router with a route group `(pages)/` for layouts that share the authenticated wrapper. Public routes (currently just `/auth`) are defined in the `PUBLIC_ROUTES` array inside `AuthRoute`. The viewport is intentionally constrained to `max-w-[450px]` — this is a mobile-first PWA.

### Server module structure
Each domain lives in its own NestJS module following the standard controller → service → entity pattern:

| Module | Responsibility |
|--------|----------------|
| `auth` | Register/login/logout, JWT signing, Argon2 password hashing |
| `users` | User CRUD, avatar upload/download via MinIO |
| `pets` | Pet CRUD + time-based stats degradation |
| `storage` | MinIO (S3-compatible) client wrapper |
| `common` | Shared decorators (`@GetUser`), guards (`JwtAuthGuard`), interceptors (`LoggingInterceptor`) |

### Pet stats degradation
Pet stats (hunger, thirst, energy, hygiene, toilet) are **not** updated on a real-time timer. Instead, `calculateCurrentStats` in `PetsService` computes the degradation retroactively whenever a pet is fetched, based on the elapsed time since `updatedAt` in 5-second intervals. It then persists the recalculated values back to MongoDB. The per-interval decay rates are hardcoded in that method.

### File uploads
Multer is configured globally in `AppModule` to write to the OS temp directory with a UUID filename. The `UsersService` then streams the temp file into MinIO via `StorageService` and deletes the local temp file.

### CORS
The server allows credentials and permits only local/private-network origins (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x). This is enforced by a custom origin callback in `server/src/main.ts`.

## Environment

Both `.env` files are gitignored. Key variables:

**`apps/client/.env`** — `NEXT_PUBLIC_SERVER_URL` (points to the server, default `http://localhost:3001`)

**`apps/server/.env`** — `MONGODB_URI`, `JWT_SECRET`, `STORAGE_ENDPOINT` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` (MinIO), `CLIENT_URL`

## Path aliases

- **Client:** `@/*` maps to `src/*` (configured in `apps/client/tsconfig.json`)
- **Server:** uses bare `src/…` imports resolved by `tsconfig-paths` at test time; NestJS CLI handles them at build time
