# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, with feature folders such as `app/(dashboard)` for internal tools and `app/m` for mobile flows. Shared UI sits in `components/`, while long-lived services, hooks, and utilities are under `lib/`. API surface area is implemented as route handlers in `app/api/`. Quality assets, including the new automated suites, reside in `tests/` (active) and `archive/old-tests/` (legacy reference). Operational tooling and one-off maintenance scripts live in `scripts/`, and infrastructure state is tracked in `supabase/`.

## Build, Test, and Development Commands
Use `npm run dev` for a local Next.js server or `npm run dev:docker` when running the full stack via Docker Compose. Ship-ready builds come from `npm run build`, and `npm run build:docker` produces the container image. Execute `npm run setup:dev` on a fresh clone to seed environment files and the development database. The primary QA pipelines are `npm run test:api`, `npm run test:ui`, and `npm run test:e2e`; each automatically calls `npm run test:validate` to confirm prerequisites. Run `npm run lint` (or `npm run lint:fix`) before opening a pull request.

## Coding Style & Naming Conventions
TypeScript is required throughout the repo. Favor functional React components with `PascalCase` filenames (for example `JobSelectionDialog.tsx`) and `camelCase` hooks (`useGpsTracking`). Keep indentation at two spaces, rely on ESLint’s default rule set, and reuse existing utility modules instead of duplicating helpers. CSS modules and Tailwind classes should match the component’s intent; avoid global overrides unless coordinated with Design.

## Testing Guidelines
Vitest powers API and unit coverage, while Playwright runs UI and end-to-end scenarios. Match existing naming patterns: place API tests in `tests/api/*.test.ts` and UI specs under `tests/ui/*.spec.ts`. Before submitting, run the narrowest suite touched by your change, then the full `npm run test` command for release readiness. Update fixtures via `tests/setup/test-data-seeder.ts` instead of hand-editing JSON.

## Commit & Pull Request Guidelines
Commits follow conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`) and should group logical units of work. Reference related scripts or migrations in the body when they affect operational flows. Pull requests must include a concise summary, linked issue or ticket, test evidence (command output, screenshots, or logs), and rollback notes for risky deployments. Request review from module owners listed in `BUILD_AND_TEST_SUMMARY.md` when touching shared systems.

## Agent Workflow Tips
Prefer enhancing the active `tests/` suites rather than reviving archived flows. When introducing automation, add helper utilities under `tests/helpers/` and export them via `tests/helpers/index.ts`. Coordinate Supabase changes by placing new migrations in `supabase/migrations/` and documenting any manual steps in the PR.
