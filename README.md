# Widgetable

A small virtual-pet web app monorepo (Next.js client, NestJS server). This repository contains two apps and shared packages.

## Features

- Mobile-first PWA virtual pet app with a Next.js frontend and NestJS backend
- JWT authentication, MongoDB data store, and S3/MinIO-compatible storage for uploads
- Monorepo using npm workspaces; independent client and server apps for local development

## Repository layout

- apps/client — Next.js 16 frontend (React 19)
- apps/server — NestJS 11 backend
- packages — shared packages

## Getting started

Prerequisites:

- Node.js (LTS), npm (or your package manager)
- A MongoDB instance (or a hosted MongoDB URI)
- MinIO or other S3-compatible storage for file uploads

Install dependencies from the repository root:

```bash
npm install
```

Start the client (development):

```bash
npm run dev:client
```

Start the server (development):

```bash
npm run dev:server
```

Configuration: Per-app `*.env.example` files are provided to help with local setup. Copy to a local env file (e.g. `.env` or `.env.local`) and fill values on your machine — do not commit secrets.

---
