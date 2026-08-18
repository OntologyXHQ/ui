# Release Contract

## Local acceptance

```bash
pnpm install --frozen-lockfile
pnpm release:check
pnpm package:tarball
```

`release:check` proves catalog freshness, standalone boundaries, type checks, tests, package build, publication artifact shape, Studio production build, and a clean consumer installation/build from the packed tarball.

## Public npm publication

The repository contains a guarded GitHub Actions release workflow. Publishing is disabled unless the repository variable `NPM_PUBLISH_ENABLED` is exactly `true`.

Before enabling it:

1. Own/configure the `@oxs` npm scope (or rename the package scope).
2. Replace `UNLICENSED` with the intended license.
3. Set `packages/ui/package.json.repository.url` to the exact GitHub repository URL.
4. Configure npm Trusted Publishing for the package, GitHub repository, and workflow filename `release.yml`.
5. Use a GitHub-hosted runner and keep `id-token: write` permission on the release workflow.
6. Tag exactly the package version (`v0.1.0` for version `0.1.0`).

`check-publish-readiness.mjs` refuses publication if the repository identity/license is not finalized or the npm CLI is below the Trusted Publishing client floor. The publish job does not use a long-lived npm token.

## Production Studio

`pnpm studio:build` generates the catalog, builds the Studio, and validates the static production artifact. `pnpm studio:preview` serves the built artifact locally on port 4174.

The `studio-pages.yml` workflow deploys `apps/ui-studio/dist` through GitHub Pages. By default project Pages uses `/<repository>/` as the Vite base. Set repository variable `STUDIO_BASE_PATH=/` for a custom domain/root deployment, or another normalized base path when required.

The deploy job runs the same `release:check` used locally before uploading the Pages artifact.
