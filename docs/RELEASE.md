# Release Contract

## Identity

- GitHub repository: `OntologyXHQ/ui`
- npm package: `@ontologyx/ui`
- license: MIT
- Studio: `https://ontologyxhq.github.io/ui/`
- first public prerelease: `0.1.0-beta.1` with npm dist-tag `beta`

## Local acceptance

```bash
pnpm install --frozen-lockfile
pnpm release:check
pnpm package:tarball
```

`release:check` proves catalog freshness, standalone boundaries, type checks, tests, package build, publication artifact shape, Studio production build, a Node-safe package import, and a clean Vite consumer installation/build from the packed tarball.

## Bootstrap the first public npm version

Trusted Publishing can only be attached after the package exists in the npm registry. For the first version, publish once interactively from the already-validated package:

```bash
cd packages/ui
npm publish --access public --tag beta
```

The npm account performing this bootstrap publish must satisfy npm's interactive publishing security requirements.

Then configure GitHub Actions as the package's trusted publisher (npm CLI >= 11.15.0 and account-level 2FA are required for `npm trust`):

```bash
npm install -g npm@^11.15.0
npm trust github @ontologyx/ui \
  --file release.yml \
  --repo OntologyXHQ/ui \
  --allow-publish \
  --yes
npm trust list @ontologyx/ui
```

Finally enable automated npm publication for future release tags:

```bash
gh variable set NPM_PUBLISH_ENABLED -R OntologyXHQ/ui --body true
```

## Tagged releases

The release workflow verifies the complete repository, validates tag/package identity, publishes through npm OIDC when the exact version is not already present, and creates the corresponding GitHub Release. Prerelease versions use the `beta` npm dist-tag; stable versions use `latest`.

For the bootstrap version, publish npm first, configure trust, then create/push the matching Git tag. The workflow detects that the exact npm version already exists and will not try to republish it.

```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

## Production Studio

`pnpm studio:build` generates the catalog, builds the Studio, and validates the static production artifact. `pnpm studio:preview` serves the built artifact locally on port 4174.

The `studio-pages.yml` workflow deploys `apps/ui-studio/dist` through GitHub Pages. Project Pages uses `/<repository>/` as the Vite base by default. Set repository variable `STUDIO_BASE_PATH=/` for a custom-domain/root deployment.
