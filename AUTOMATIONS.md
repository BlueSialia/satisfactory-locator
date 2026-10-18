# Automations

This document describes the repository automations and the checks they enforce.

## Local development

The repository uses `mise.toml` to select Node.js 24 and `flake.nix` to provide a Nix development shell. With direnv installed, run `direnv allow` once after cloning. Without direnv, enter the shell explicitly with `nix develop`.

`npm run dev` generates the normalized resource asset before starting Vite. `npm run build` performs the same generation before creating the production bundle. The generator imports a TypeScript module directly, which relies on Node.js 24's built-in type stripping. The generated `public/data/resource-nodes.json` file is ignored because it is reproducible from `src/data/resources.json`.

## Local git hooks

Git hooks are configured through `core.hooksPath` pointing to `.githooks/`. Run `./setup-hooks.sh` once to enable them.

The commit-message hook validates that the first line follows Conventional Commits.

## GitHub Pages deployment

The deployment workflow lives in `.github/workflows/deploy-pages.yml`.

**Triggers:** pushes to `main` or manual dispatch.

The workflow:

1. Installs dependencies with `npm ci`.
2. Runs `npm run check`, covering linting, type checking, tests, coverage, the production build, bundle-size limits, and unused-code analysis.
3. Uploads the generated `dist/` directory to GitHub Pages.
4. Deploys the Pages artifact.

A failing check prevents deployment. In repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Security audit

The security workflow lives in `.github/workflows/security.yml`.

**Triggers:** pushes to `main`, every Monday at 06:00 UTC, or manual dispatch.

It runs `npm audit --audit-level=high` against the locked dependency tree.

## Configuration files

| File | Purpose |
|---|---|
| `.envrc` | Loads the Nix development shell for direnv. |
| `flake.nix` | Defines the Node.js development environment for Linux and macOS. |
| `mise.toml` | Selects the Node.js version. |
| `.githooks/commit-msg` | Enforces Conventional Commit messages locally. |
| `setup-hooks.sh` | Enables the local git hooks. |
| `package.json` | Defines scripts, metadata, and bundle-size thresholds. |
| `scripts/generate-resource-data.mjs` | Writes the normalized resource asset. |
| `src/data/normalize.ts` | Validates and normalizes upstream resource data. |
| `biome.json` | Defines formatting and linting rules. |
| `vite.config.ts` | Build, test, and coverage configuration. |
| `.github/workflows/deploy-pages.yml` | Checks and deploys the application from `main`. |
| `.github/workflows/security.yml` | Runs the npm dependency security audit. |
