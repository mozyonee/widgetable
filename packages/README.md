# packages

This folder contains workspace packages used by the monorepo.

## `@widgetable/types` (packages/types)

- Contains shared TypeScript types used by `client` and `server`.
- Published locally via workspace/file dependency during development.
- Build notes:
  - `composite: true` in `tsconfig.json` is enabled to support project references.
  - Build with `npm run build --prefix packages/types` (root helper: `npm run build:types`).

Usage:
- Import shared types with `import type { User } from "@widgetable/types";` in other packages.
- Prefer to update the shared `types` package when adding cross-cutting types, and then rebuild the package.

Tips:
- Use `npm run build` at repo root to ensure `packages/types` is built before the server.
- Consider switching to a package manager with workspace protocol (pnpm/yarn) if you want to use `workspace:*` conventions.
