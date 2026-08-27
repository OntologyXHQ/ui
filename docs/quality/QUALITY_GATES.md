# OntologyX UI quality gates

The gate system protects long-lived product and architecture properties. It does not track delivery batches: no patch IDs, numbered closeout commands, magic success markers or one-off assertions belong in the canonical gate contract.

V1 accepted/certified visual contracts remain the compatibility floor. New V2 semantic contracts must pass the same normal repository gates plus focused behavior evidence while they mature.

## G0 — architecture

`pnpm gate:architecture`

Protects repository/package ownership and dependency direction:

- standalone `@ontologyx/ui` repository, dist-only package exports and explicit stylesheet side effect;
- zero production runtime dependencies; React/ReactDOM stay peers;
- canonical visual direction remains Foundations → Primitives → Components → System UI;
- internal interaction/focus/overlay/motion/gesture/scroll/editing/drag/cursor engines never depend upward on visual layers;
- System UI core stays above accepted Components and may not bypass them for Primitives/engines;
- privileged System surfaces stay host-neutral: browser/native/backend/process/notification/IME authority stays outside React UI;
- V2 Semantic may consume public Components through its bridge, while V1 visual layers do not depend upward on Semantic;
- V2 IR stays versioned, JSON-serializable and semantic: no functions, arbitrary DOM/CSS or host/business authority;
- production source cannot depend on Studio or OXS/product internals;
- responsive behavior is container-first, direction is logical, preference and resolved environment state remain distinct, and safe area stays separate from transient occlusion;
- package CSS stays on the semantic token substrate; visual/interaction primitives retain their accepted ownership boundaries;
- G6 tooling uses exact-pinned `playwright-core` + `axe-core` and an installed Chrome/Chromium rather than a browser-downloading dependency.

Focused architecture commands remain available when useful, including:

```bash
pnpm gate:system-ui-core
pnpm gate:privileged-system-surfaces
```

## G1 — catalog acceptance

`pnpm gate:catalog`

The generated visual catalog must be source-derived and fresh. Visual exports use explicit lifecycle states: `candidate`, `accepted`, `experimental`, or `deprecated`.

An `accepted` visual export requires complete usage/accessibility/RTL/touch/responsive guidance, documented public props, a real render path, and a `docs/quality/CERTIFICATIONS.json` record binding it to concrete behavior tests, named G6 scenarios and required browser axes. Generic smoke coverage is not component certification.

Pure non-visual V2 semantic APIs are not forced into the visual catalog; their acceptance is owned by type/behavior/architecture tests and later Studio semantic inspection evidence.

## G2 — types

`pnpm gate:types`

Package, Studio and demo must typecheck. Generated output, casts or skipped files may not be used to hide contract errors.

## G3 — behavior

`pnpm gate:behavior`

Runs host-safety plus unit/interaction/runtime tests. Tests assert observable contracts at the lowest useful owner. V2 semantic tests must prove serialization/validation, command/binding/source authority separation, typed mismatch diagnostics, resolved-environment projection, deterministic command placement/adaptive choice resolution and canonical component bridging without embedding executable behavior or host-owned values in Author IR.

## G4 — Studio integrity

`pnpm gate:studio`

Studio is a real consumer, not a parallel UI framework:

- source is reachable from the Studio entry unless it is an ambient declaration;
- reusable controls come from public `@ontologyx/ui` APIs;
- package CSS is imported exactly once by the browser host;
- raw interactive HTML and source deep-imports are forbidden where the Studio contract disallows them;
- accepted visual entries expose real previews plus source-linked certification evidence;
- V2 Studio work may inspect/compose semantic definitions, but must not gain application/native authority or bypass the public package boundary.

## G5 — build/package

`pnpm gate:build`

Builds the publishable package plus production Studio/demo surfaces and validates emitted JS/types/CSS/package exports. Source-only confidence is insufficient.

## G6 — real browser acceptance

`pnpm gate:browser`

G6 builds production artifacts, serves Studio on loopback and drives an installed Chrome/Chromium with `playwright-core`. `ONTOLOGYX_UI_BROWSER=/absolute/path` is the supported explicit override.

The browser suite protects the accepted cross-axis runtime contract, including:

- deterministic Studio deep links and environment projection;
- serious/critical axe failures as blockers;
- sequential/roving keyboard focus, visible focus, activation, modal isolation, Escape and restoration;
- pointer/touch cancellation, coarse-pointer long press and nested-scroll hit-test ownership;
- RTL/LTR, themes, density, reduced motion, modality/pointer precision, safe-area/occlusion and container adaptation;
- field/form/native text behavior, secure editable-session boundaries and keyboard-occlusion response;
- overlay/floating/feedback lifecycle, logical scroll/snap, motion interruption/reduced-motion settlement and measurable frame budgets;
- gesture arena, drag/drop, editing/clipboard race safety and cursor realm ownership;
- developer compositions, semantic Author IR → Runtime IR adaptation, System UI core and privileged System surfaces without host-authority leakage;
- Studio rendering of real public exports and source-bound certification evidence;
- browser console/page errors and direct DOM isolation violations as blockers.

G6 writes machine-readable evidence under `artifacts/browser-acceptance/`. Screenshots are review evidence, not pass/fail pixel snapshots. Adversarial harness self-tests must keep proving the suite rejects inaccessible, geometrically broken or incorrectly scoped fixtures.

## G7 — release

`pnpm release:check`

Extends G0..G6 with production Studio inspection, deterministic tarball creation and a fresh packed-tarball consumer proof covering install, Node import, **SSR render**, types, explicit CSS consumption, Vite production build, **tree-shaking**, and one **React/React DOM peers** graph without a package-owned duplicate runtime.

The current V1 release line also checks its reviewed artifact budgets/certification freeze. Real OXS certification remains an explicit cross-repository operation (`pnpm v1:oxs:check -- /path/to/OXS`) rather than a hidden day-to-day prerequisite.

## Canonical commands

```bash
pnpm format         # explicit mutating formatter
pnpm quality        # G0..G3
pnpm lint           # explicit repository-wide lint/debt audit
pnpm build          # production package + Studio + demo builds
pnpm gate:browser   # focused G5 + G6 browser acceptance
pnpm verify         # canonical G0..G6 acceptance
pnpm release:check  # local G0..G7 artifact proof
pnpm v1:oxs:check -- /path/to/OXS  # explicit real-consumer proof when required
```

Focused gates are debugging tools; final acceptance uses the canonical aggregate gate appropriate to the change.

## Non-negotiable rules

1. **Stable invariants only.** Canonical gates protect reusable properties, never a patch/batch ID.
2. **No fake coverage.** Metadata or smoke contact is not evidence of component/browser behavior.
3. **No test weakening.** Fix production behavior or correct a semantically wrong test with equivalent/stronger evidence.
4. **No hidden compatibility debt.** Breaking cleanup is explicit and migration-aware; accidental aliases do not accumulate.
5. **No Studio exception.** Studio dogfoods the same public surface available to consumers.
6. **No platform impersonation.** Native/compositor/IME/process/data authority stays with the host/application.
7. **No release from source-only confidence.** Packed-artifact consumer proof is mandatory.
8. **Fix forward.** Applied development changes are never automatically rolled back because validation fails.
9. **One definition of done.** Code, tests, docs/inspection evidence, applicable browser axes and package boundaries agree.
10. **No downloaded-browser assumption.** Browser acceptance uses an installed Chrome/Chromium or fails with an actionable path requirement.
