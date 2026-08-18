# OntologyX UI

Standalone workspace for the `@ontologyx/ui` platform package and its self-hosted Studio. This repository was extracted from OXS so UI can evolve, build and release independently from the compositor/product repository. The active UI plan was reset from zero on 2026-08-19; pre-reset implementation is candidate material until reaccepted under the new quality gates.

## Workspace

```text
apps/ui-studio/   self-hosted catalog, docs, examples and playground
packages/ui/      publishable @ontologyx/ui package
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
pnpm quality        # fast canonical gates: architecture/catalog/types/behavior
pnpm verify         # full repository acceptance including Studio/build/package
pnpm build          # package + Studio production builds
pnpm package:smoke  # pack, install into a clean consumer, typecheck and Vite-build
pnpm release:check  # verify + production artifact + tarball consumer smoke
pnpm snapshot       # fast tracked-source handoff snapshot
pnpm package:tarball
pnpm studio:build    # production Studio artifact
pnpm studio:preview  # preview built Studio on :4174
```

## Architecture

Production direction is `Foundations → Primitives → Components → System UI`. Native/compositor implementations are outside this repository; only runtime-neutral contracts and visual surfaces live here. See `docs/architecture/BOUNDARIES.md`.

## Publication safety

`@ontologyx/ui` is an MIT-licensed public package under the `ontologyx` npm organization. The first bootstrap publish is interactive; subsequent tagged releases use npm Trusted Publishing from `OntologyXHQ/ui` and remain guarded by `NPM_PUBLISH_ENABLED=true`.

## Active rebuild frontier

The canonical plan is `docs/roadmap/UI_TASK_LIST.md`. `UIR00` resets completion truth and quality gates; `UIR01` adds real browser acceptance before any public visual export can be promoted from `candidate` to `accepted`. Native Wayland/compositor/IME implementations stay in OXS or another host consumer.

## Studio deployment

The Studio is a static Vite application and can be hosted independently from npm publication. GitHub Pages deployment is provided in `.github/workflows/studio-pages.yml`; public package publishing remains separately guarded.


## Acceptance model

Pre-reset `stable`/`provisional` labels are not trusted. Public visual exports are reclassified as `candidate` and are promoted to `accepted` only after the owning rebuild part closes the required source, behavior, Studio, browser and package gates. See `docs/quality/QUALITY_GATES.md`.
