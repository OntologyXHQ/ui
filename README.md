# OXS UI

Standalone workspace for the `@oxs/ui` platform package and its self-hosted Studio. This repository was extracted at the UIP15 frontier so UI can evolve, build and release independently from the OXS compositor/product repository.

## Workspace

```text
apps/ui-studio/   self-hosted catalog, docs, examples and playground
packages/ui/      publishable @oxs/ui package
docs/             canonical boundaries, release contract, roadmap/reference
scripts/          standalone quality, package and release checks
```

## Start

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Studio runs on port 5174. It dogfoods UI source directly for fast local iteration. Package publication is validated separately from the real packed tarball.

## Canonical commands

```bash
pnpm dev            # generate catalog and run Studio
pnpm quality        # non-mutating acceptance gate
pnpm build          # package + Studio production builds
pnpm package:smoke  # pack, install into a clean consumer, typecheck and Vite-build
pnpm release:check  # quality + tarball consumer smoke
pnpm package:tarball
pnpm studio:build    # production Studio artifact
pnpm studio:preview  # preview built Studio on :4174
```

## Architecture

Production direction is `Foundations → Primitives → Components → System UI`. Native/compositor implementations are outside this repository; only runtime-neutral contracts and visual surfaces live here. See `docs/architecture/BOUNDARIES.md`.

## Publication safety

`@oxs/ui` is structurally publishable but starts as `UNLICENSED`. Public npm publication is guarded by `NPM_PUBLISH_ENABLED=true`; configure the npm scope, license and Trusted Publisher before enabling it.

## Next frontier

UIP16 continues here for reusable text-input/IME/secure-input/occlusion contracts and visual behavior. Native Wayland/compositor/IME implementations stay in the OXS consumer repository.

## Studio deployment

The Studio is a static Vite application and can be hosted independently from npm publication. GitHub Pages deployment is provided in `.github/workflows/studio-pages.yml`; public package publishing remains separately guarded.
