# Widgetable

A small virtual-pet web app monorepo (Next.js client, NestJS server).

## Repository layout

| Path | Description |
|------|-------------|
| [apps/client](apps/client) | Next.js 16 frontend (React 19), port 3000 |
| [apps/server](apps/server) | NestJS 11 backend, port 3001 |
| [packages/types](packages/types) | Shared TypeScript types & constants (`@widgetable/types`) |
| [packages/i18n](packages/i18n) | Shared translation system (`@widgetable/i18n`) |

## Getting started

Prerequisites: Node.js LTS, a MongoDB instance, and MinIO or another S3-compatible storage.

```bash
npm install
```

```bash
npm run dev:client   # start client on port 3000
npm run dev:server   # start server on port 3001
```

Copy `.env.example` to `.env` (server) or `.env.local` (client) in each app and fill in the values before starting.

## Root scripts

```bash
npm run build            # build all (types → client → server)
npm run build:types      # build @widgetable/types only
npm run tsc              # type-check client and server
npm run format           # format client and server
npm run test             # run tests across all workspaces
```
