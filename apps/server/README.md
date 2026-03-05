# Server

NestJS 11 backend for Widgetable. Runs on port 3001.

## Commands

```bash
npm run start:dev    # watch-mode dev server
npm run build        # nest build → dist/
npm run start:prod   # node dist/main (production)
npm run lint         # ESLint --fix over src & test
npm run format       # Prettier over src & test
npm run typecheck    # TypeScript check without emitting
npm run test         # Jest unit tests (*.spec.ts)
npm run test:watch   # Jest in watch mode
npm run test:cov     # Jest with coverage report
npm run test:e2e     # Jest with test/jest-e2e.json config
```

## Environment

Copy `.env.example` to `.env` and fill values:

| Variable | Description |
|----------|-------------|
| `CLIENT_URL` | Client origin (used for CORS) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `STORAGE_ENDPOINT` | MinIO / S3-compatible endpoint |
| `STORAGE_PORT` | MinIO port |
| `STORAGE_REGION` | Storage region |
| `STORAGE_ACCESS_KEY` | Storage access key |
| `STORAGE_SECRET_KEY` | Storage secret key |

## Architecture

### Module structure

Each domain is a NestJS module following the controller → service → entity pattern:

| Module | Responsibility |
|--------|----------------|
| `auth` | Register/login/logout, JWT signing, Argon2 password hashing |
| `users` | User CRUD, avatar upload/download via MinIO |
| `pets` | Pet CRUD + retroactive stats degradation |
| `rewards` | Pet action claiming system |
| `friends` | Friend management |
| `gifts` | Gift exchange system |
| `notifications` | Push notifications (web-push) |
| `coparenting` | Shared pet ownership |
| `requests` | Friend request management |
| `storage` | MinIO (S3-compatible) client wrapper |
| `common` | Shared decorators (`@GetUser`), guards (`JwtAuthGuard`), interceptors (`LoggingInterceptor`) |

### Authentication

JWT is issued as an HTTP-only cookie named `Authentication` on `POST /auth/login`. The Passport JWT strategy (`src/auth/strategies/jwt.strategy.ts`) extracts it from the cookie. All protected routes use `JwtAuthGuard`.

### Pet stats degradation

Stats (hunger, thirst, energy, hygiene, toilet) are not updated in real time. `calculateCurrentStats` in `PetsService` computes decay retroactively on every pet fetch, based on elapsed time since `updatedAt` in 5-second intervals, then persists the result back to MongoDB.

### File uploads

Multer is configured globally in `AppModule` to write uploads to the OS temp directory with a UUID filename. `UsersService` streams the temp file into MinIO via `StorageService`, then deletes the local file.

### CORS

Only local/private-network origins are allowed (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16–31.x.x). Enforced by a custom origin callback in `src/main.ts`.

### Path aliases

Bare `src/…` imports are resolved by `tsconfig-paths` at test time and by the NestJS CLI at build time.
