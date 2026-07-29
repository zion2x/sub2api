# Repository Guidelines

## Project Structure & Module Organization

`backend/` contains the Go service: entry points in `cmd/`, application code in `internal/`, Ent-generated code in `ent/`, and migrations in `migrations/`. `frontend/` is the Vue 3/TypeScript application, organized under `src/components`, `views`, `stores`, `api`, and `utils`. Frontend tests are colocated in `__tests__/` or named `*.spec.ts`; Go tests use `*_test.go`. Deployment files belong in `deploy/`, documentation in `docs/`, and release automation in `.github/workflows/`.

## Build, Test, and Development Commands

- `make build`: build both backend and frontend.
- `cd backend && make build`: produce `backend/bin/server`.
- `cd backend && go test -tags=unit ./...`: run backend unit tests.
- `cd backend && go test -tags=integration ./...`: run integration tests; PostgreSQL/Redis may be required.
- `cd frontend && pnpm install`: install dependencies. Use pnpm, not npm.
- `cd frontend && pnpm dev`: start the Vite development server.
- `cd frontend && pnpm build`: type-check and create a production build.
- `cd frontend && pnpm test:run`: run Vitest once; `pnpm lint:check` validates lint rules.

## Coding Style & Naming Conventions

Format Go with `gofmt`; packages are short and lowercase, exported identifiers use `PascalCase`, and internal names use `camelCase`. Run `golangci-lint run ./...` before submitting backend changes. Vue components use `PascalCase.vue`, composables start with `use`, and tests mirror the subject, for example `SettingsView.spec.ts`. Follow existing two-space indentation and single quotes in TypeScript/Vue. Commit regenerated Ent or Wire output when schemas or wiring change.

## Testing Guidelines

Add focused regression tests for behavior changes. Prefer unit tests for service logic and Vitest component tests for UI behavior; use integration tags for database, Redis, or cross-package contracts. Run the smallest relevant suite while developing, then broader checks before a pull request.

## Commit & Pull Request Guidelines

Use Conventional Commit subjects: `feat:`, `fix:`, `refactor:`, `build:`, `test:`, or `chore:`; scopes are encouraged, such as `feat(frontend): ...`. Keep commits focused. Pull requests should explain the change, link issues, list verification commands, and include screenshots for UI changes. Call out migrations, configuration changes, generated files, and release impact.

## Security & Release Notes

Never commit credentials or `.env` files; start from `deploy/.env.example` and `deploy/config.example.yaml`. This fork publishes binary-only releases from `zion2x/sub2api`. Release tags use the SemVer line `v100.0.1`, `v100.0.2`, then `v100.1.0` for minor releases. Versions must increase; avoid `z` prefixes/suffixes and `v1.x`. Fetch upstream tags with `git fetch origin-master --tags`, and preserve fork update references when merging.
