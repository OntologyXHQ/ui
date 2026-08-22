# Pre-Publication Product Polish Checkpoint

This checkpoint sits between `UIR17 PUBLICATION READY` and the external `v1.0.0` tag/npm publication. It is deliberately **not** a new roadmap batch and does not reopen the accepted public API by default.

## 1. Studio workbench polish

The self-hosted UI Kit Studio remains the source/evidence browser, but its presentation is preview-first rather than documentation-wall-first:

- compact catalog navigation; accepted status is not repeated on every row;
- one stable Studio title instead of duplicating the active export in the AppBar and hero;
- the live public component preview is the primary visual surface;
- import and platform-contract guidance are compact secondary cards;
- source-linked certification evidence remains present but is collapsed by default;
- the existing stacked Overview → API → Examples → Playground reading flow remains intact.

No Studio-specific component implementation may replace a public `@ontologyx/ui` export.

## 2. Complete System demo consumer

`apps/ui-demo` is a real consumer of the public SDK, not a second System implementation. It demonstrates desktop chrome, workspace/window content, app launcher, quick settings, notifications, command surface, OSD, Settings layout and adaptive public controls.

The demo intentionally models the OXS host boundary: an App/Package Registry supplies `{ id, name, icon }` view models and launch policy. The UI package renders the supplied image resource and reports stable activation IDs; it does not discover installed applications, parse `.desktop` files, resolve icon themes or launch processes.

Canonical development commands:

```bash
pnpm dev ui       # UI Kit Studio only (:5174)
pnpm dev demo     # System demo only (:5175)
pnpm dev          # both together
```

## 3. Visual + performance evidence

`pnpm visual:check` builds Studio, visits every generated public catalog entry in one canonical environment, captures the live component preview, and records conservative runtime metrics. Evidence is written under `artifacts/visual-performance/`.

Screenshots are **review/regression evidence**, not a cross-machine pixel-perfect failure gate. Exact image equality is intentionally avoided because font rasterization, GPU backend and host Chrome differences create false failures. Pass/fail is based on gross-regression budgets for:

- time until the component workbench is visible;
- sampled frame p95;
- cumulative long-task duration when the browser exposes it;
- workbench DOM size.

Each screenshot receives a SHA-256 fingerprint in `latest.json` so changes can still be audited or compared in a fixed certification environment later.

`pnpm demo:smoke` separately browser-checks the System demo, captures a screenshot, verifies launcher → stable application activation and Quick Settings, and rejects serious/critical axe violations.

## Checkpoint

```bash
pnpm polish:check
```

Publication must remain blocked if this checkpoint exposes a real public API, accessibility, runtime, demo-consumer or gross performance defect. Cosmetic screenshot differences alone are review input, not a reason to mutate the SDK contract.
