# OntologyX UI

Standalone workspace for the `@ontologyx/ui` platform package and its self-hosted Studio. This repository was extracted from OXS so UI can evolve, build and release independently from the compositor/product repository. The active UI plan was reset from zero on 2026-08-19; pre-reset implementation is candidate material until reaccepted under the new quality gates.

## Workspace

```text
apps/ui-studio/   self-hosted catalog, docs, examples and playground
apps/ui-demo/     complete System UI demo composed from the public SDK
packages/ui/      publishable @ontologyx/ui package
docs/             canonical boundaries, release contract, roadmap/reference
scripts/          standalone quality, package and release checks
```

## Start

```bash
pnpm install --frozen-lockfile
pnpm dev ui       # UI Kit / Studio on :5174
pnpm dev demo     # System demo on :5175
pnpm dev          # both together
```

Studio runs on port 5174 and the System demo on port 5175. Its generated component page is one stacked reading flow—Overview, API, Examples and Playground stay mounted together and use the public OntologyX typography/layout surface rather than Studio-local tab chrome. Search plus layer/lifecycle filters are shareable URL state; accepted entries expose direct or explicit dedicated previews, generated state-ownership guidance, and source-linked G5/G6 certification evidence. System application examples receive host-resolved icon resources—the Studio/UI package never discovers installed apps or owns launch authority. Package publication is validated separately from the real packed tarball. The demo is a consumer, not a second UI implementation: host/App Registry code resolves application metadata, image resources and launch policy while `@ontologyx/ui` renders those view models and reports stable activation IDs. Visual/performance capture writes canonical component screenshots plus render/frame/long-task/DOM evidence under `artifacts/visual-performance/`; screenshots are review evidence, while pass/fail uses conservative runtime metrics rather than brittle cross-machine pixel equality.

## Canonical commands

```bash
pnpm dev ui         # generate catalog and run the UI Kit / Studio only
pnpm dev demo       # run the complete System demo only
pnpm dev            # run Studio and System demo together
pnpm format         # formatter only; mutating and explicit
pnpm lint           # explicit repo-wide Biome lint/debt audit; not part of canonical verify
pnpm quality        # non-mutating fast gate: format freshness + architecture + catalog + types + behavior
pnpm build          # package + Studio production builds
pnpm gate:browser   # build once, then run focused production browser acceptance
pnpm verify         # canonical G0..G6 acceptance; one production build, no release/consumer side effects
pnpm release:check  # canonical local G0..G7 artifact proof; no OXS clone and no planning mutation
pnpm package:tarball
pnpm package:smoke  # consume the already-built stable tarball in a fresh generic app
pnpm v1:oxs:check -- /home/l/Workspace/OXS  # explicit cross-repository check, only when needed
pnpm snapshot       # fast tracked-source handoff snapshot
pnpm studio:build    # production Studio artifact
pnpm studio:preview  # preview built Studio on :4174
pnpm demo:check      # typecheck + production-build the System demo
pnpm demo:smoke      # real-browser demo smoke + screenshot + serious/critical axe check
pnpm visual:check    # canonical screenshot corpus + conservative per-component performance budgets
pnpm polish:check    # Studio contract + demo smoke + visual/performance evidence
```

## Architecture

Production direction is `Foundations → Primitives → Components → System UI`. Native/compositor implementations are outside this repository; only runtime-neutral contracts and visual surfaces live here. See `docs/architecture/BOUNDARIES.md`.

## Publication safety

`@ontologyx/ui` is an MIT-licensed public package under the `ontologyx` npm organization. Stable tagged releases use npm Trusted Publishing from `OntologyXHQ/ui` and remain guarded by `NPM_PUBLISH_ENABLED=true`; local closeout never tags, pushes or publishes implicitly.

## V1 closeout frontier

The reset/reacceptance program converges on one stable `@ontologyx/ui@1.0.0` release candidate: all 100 intended public visual exports are promoted to `accepted`, certification ownership covers every accepted export, developer compositions and System UI are bound to dedicated behavior/browser journeys, and Studio renders the real public exports while exposing certification evidence instead of inferred coverage. Local convergence is deliberately simple: `pnpm verify` proves G0..G6 and `pnpm release:check` proves the packed G7 artifact without modifying planning files or touching OXS. Real OXS validation is a separate explicit cross-repository operation (`pnpm v1:oxs:check -- /path/to/OXS`). UIR17 first reaches a truthful `PUBLICATION READY` state after the final measured budgets, packed consumer and OXS RC all pass; only a verified Git tag plus registry `latest` publication can close `UI-1708`. Native Wayland/compositor/IME authority remains outside this repository.

## Studio deployment

The Studio is a static Vite application and can be hosted independently from npm publication. GitHub Pages deployment is provided in `.github/workflows/studio-pages.yml`; public package publishing remains separately guarded.


## Acceptance model

Pre-reset `stable`/`provisional` labels are not trusted. Public visual exports are reclassified as `candidate` and are promoted to `accepted` only after the owning rebuild part closes the required source, behavior, Studio, browser and package gates. See `docs/quality/QUALITY_GATES.md`.
