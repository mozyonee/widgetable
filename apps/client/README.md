# Client

Next.js 16 (React 19) frontend for Widgetable. Mobile-first PWA, viewport constrained to `max-w-[450px]`.

## Commands

```bash
npm run dev          # dev server (webpack mode, binds 0.0.0.0:3000)
npm run build        # production build
npm run lint         # ESLint via next lint
npm run format       # Prettier over src/**/*.{ts,tsx}
npm run typecheck    # TypeScript check without emitting
```

## Environment

Copy `.env.example` to `.env.local` and fill values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SERVER_URL` | Base URL of the server API (default `http://localhost:3001`) |

## Architecture

### Routing

App Router with a `(pages)/` route group for layouts that share the authenticated wrapper (`AuthRoute`). `AuthRoute` calls `checkAuth` on every route change and redirects unauthenticated users to `/auth`. Public routes are listed in the `PUBLIC_ROUTES` array inside `AuthRoute`.

### State

Redux Toolkit + redux-persist. A single slice (`userSlice`) holds auth status and user data, persisted via a custom storage adapter at `src/store/storage.ts`. Always use the typed hooks from `src/store/index.ts`:

```typescript
import { useAppDispatch, useAppSelector } from '@/store';
```

`PetContext` (`src/features/pets/context/PetContext.tsx`) is a plain React context for passing the currently-selected pet within a page — it is not persisted.

### API layer

A single Axios instance from `src/lib/api.ts` with `baseURL` from `NEXT_PUBLIC_SERVER_URL` and `withCredentials: true`. All API calls go through this instance. Use `callError` from `src/lib/functions.tsx` for consistent error toasts.

### Path alias

`@/*` maps to `src/*` (configured in `tsconfig.json`).
