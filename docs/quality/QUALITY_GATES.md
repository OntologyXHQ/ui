# OntologyX UI quality gates

This repository is being reaccepted from zero. Existing code is implementation inventory, not proof of quality. No public visual export is grandfathered as accepted because it existed before the rebaseline.

## Gate model

The gate system protects long-lived engineering properties. It must not grow by appending patch IDs, source-text markers, screenshots of success, or one-off assertions for a single delivery batch.

### G0 — architecture

`pnpm gate:architecture`

Protects repository and package ownership:

- standalone UI repository boundary;
- `@ontologyx/ui` public package identity and dist-only exports;
- zero production runtime dependencies, with React/ReactDOM as peers only;
- explicit stylesheet export and CSS-only side effects;
- four public visual layers: Foundations → Primitives → Components → System UI;
- internal engines may support Components but may not depend on Primitives, Components, or System UI;
- System UI may consume Components but not Primitives directly;
- production source cannot depend on Studio or OXS/product internals;
- G6 uses pinned `playwright-core` + `axe-core` and an installed system Chrome/Chromium; browser-downloading Playwright packages are not part of the repository contract.
- the public theme-token registry must resolve to real CSS defaults, semantic emphasis tones keep separate fill/text/on-fill/soft/border roles, package CSS cannot bypass the token substrate with raw color literals outside `tokens.css`, and package/Studio semantic color references must resolve to a canonical token definition.
- environment preferences and resolved runtime state stay distinct; responsive layout is container-first, device sniffing and viewport-size media-query adaptation are forbidden, CSS consumes resolved density/motion, and public box layout uses logical inline properties.
- persistent safe area and transient host occlusion are separate explicit-unit logical inputs; Components that must avoid blocked regions consume their combined environment inset rather than abusing safe area for keyboard occlusion.
- accepted Layout primitives use finite logical props and intrinsic native polymorphism; inline style/color serialization, physical directional spacing props, reverse/order APIs, and shared family demos masquerading as per-export certification are rejected by the layout gate.
- accepted Visual primitives keep typography on bounded native semantics and explicit long-token reflow, replace generic Icon animation knobs with declared stable/transient state families that consume resolved reduced-motion, require local-direction Icon mirroring, keep the 240+ static / 20+ animated optional icon pack on a separate self-contained `@ontologyx/ui/icons` package subpath, keep Surface free of Component interaction-state ownership, and keep Divider tone/thickness/inset finite and token/logical-axis backed.
- the interaction/runtime kernel keeps gesture/modal/motion state root-scoped; overlays sharing one Document arbitrate Escape/outside-pointer through one Document-realm broker while preserving UiRoot-local isolation/scroll/focus lineage; MotionClock/PerformanceObserver/timers/computed-style reads must resolve through the concrete owner Window realm rather than ambient globals.
- accepted field/text-input Components preserve native form/reset/validation/autocomplete semantics, keep SearchField actions composition-safe, never expose secure preedit/committed values through UI helpers, publish metadata-only editable-text sessions to the host, and respond to transient keyboard occlusion only through combined logical environment insets.

### G1 — catalog acceptance

`pnpm gate:catalog`

The generated catalog is source-derived and must be fresh. Every public visual export has an explicit lifecycle status:

- `candidate` — present but not yet reaccepted after the reset;
- `accepted` — reviewed and eligible for stable SDK use;
- `experimental` — intentionally unstable exploration;
- `deprecated` — scheduled for removal.

An `accepted` export must have complete usage/accessibility/RTL/touch/responsive guidance, documented public props, a real render path through an example or explicit playground fixture, and a `docs/quality/CERTIFICATIONS.json` record that binds its roadmap owner to concrete behavior-test files, named G6 scenarios, and required browser acceptance axes. Old `stable` / `provisional` claims are forbidden.

The catalog gate is intentionally strict only for `accepted` exports. This is not a waiver system: the reset starts with zero accepted visual exports, and each later part promotes exports only after its complete acceptance matrix passes.

### G2 — types

`pnpm gate:types`

Both the package and Studio must typecheck. Type errors cannot be hidden behind generated output, casts added only to satisfy the gate, or skipped files.

### G3 — behavior

`pnpm gate:behavior`

Runs host-safety plus unit/interaction/runtime tests. Tests must assert observable behavior, not implementation text. A defect repaired in a public interaction contract requires a regression test at the lowest owner that can reproduce it.

### G4 — Studio integrity

`pnpm gate:studio`

The Studio is a real consumer, not a second component library:

- every TS/TSX module must be reachable from `main.tsx` unless it is an ambient declaration;
- reusable controls must come from `@ontologyx/ui`;
- because package JS is stylesheet-neutral, the Studio browser host must import `@ontologyx/ui/styles.css` exactly once before Studio-local CSS;
- raw `<button>`, `<input>`, `<select>`, and `<textarea>` are forbidden in Studio source;
- product/host internals and source deep-imports are forbidden;
- the Studio may orchestrate state/data but may not own a parallel visual SDK.

### G5 — build/package

`pnpm gate:build`

Builds the publishable package and production Studio and validates the packed package surface. This proves emitted JS/types/CSS and package exports, not only source compilation.

### G6 — real browser acceptance

`pnpm gate:browser`

G6 is production-artifact-backed. The command first runs G5, starts the built Studio on an ephemeral loopback port, then drives an installed Google Chrome/Chromium with `playwright-core`. It never downloads a browser. `ONTOLOGYX_UI_BROWSER=/absolute/path` is the explicit escape hatch when a supported browser is installed outside normal platform locations.

The current harness proves the evidence system itself across real browser journeys:

- deterministic Studio entry/section/example deep links and environment projection (the legacy `tab` query key remains a route-compatible section selector, not visible tab chrome);
- the Foundations semantic-token substrate resolves across dark/light/custom themes without ornamental root imagery;
- serious/critical `axe-core` violations are blocking;
- keyboard sequential navigation, visible focus, roving focus and activation;
- modal isolation, Escape dismissal and focus restoration, including focus-before-isolation for modal Popovers;
- pointer cancellation and normal pointer activation;
- coarse-pointer/touch long press through Chrome's touch input pipeline, with deterministic example deep links, a non-collapsed mobile documentation viewport, explicit target centering across nested scroll containers, and hit-test ownership before dispatch;
- RTL/LTR, theme/color-scheme, density, reduced-motion, modality/pointer precision and preference-vs-resolved environment projection;
- measured container adaptive bands plus separate safe-area, transient occlusion and combined environment-inset inputs;
- narrow/reflow geometry without screenshot/pixel assertions;
- visual-primitive certification covers mixed Persian/English typography, missing-font fallback, long-token wrapping, browser page zoom, multi-state Icon transient/reduced-motion/interruption behavior, currentColor/local-direction RTL/custom glyphs, optional static+animated icon-pack breadth, and static Surface/Divider token/accessibility boundaries;
- runtime-kernel certification additionally proves cross-UiRoot portal ownership and top-most Escape ordering, plus nested MotionRuntime frame-rate ownership, interruption convergence and semantic reduced-motion settlement;
- field/text-input certification proves controlled/uncontrolled native form behavior, native replacement/autocomplete-compatible input, validation/reset/FormData semantics, composition-safe SearchField actions, secure export/preedit redaction, host metadata-only text sessions, selection/multiline hints and logical keyboard-occlusion response;
- UIR10 overlay/feedback certification proves shared Dialog/Sheet/Scrim ownership, owner-realm floating collision/Menu/Tooltip/ContextMenu behavior, stable-id ToastHost timing/live-region policy, and semantic progress/loading/empty feedback under reduced motion;
- browser console/page errors are blocking in product journeys; focused content inside `aria-hidden`/`inert` ancestry is checked as a direct DOM-semantic invariant rather than relying on browser warning transport.

G6 writes machine-readable diagnostic evidence to `artifacts/browser-acceptance/latest.json` plus a timestamped sibling. Evidence contains the source fingerprint, Git HEAD when available, browser/version, axes, scenario results and axe summaries. Screenshots are not acceptance evidence and pixel snapshots are not used.

The harness also executes intentionally broken or adversarial ephemeral browser fixtures. Those self-tests must demonstrate that axe blockers, focused-content `aria-hidden`/`inert` isolation invariants, invisible focus, global horizontal overflow, environment drift, missing deterministic routes, a missing public UI stylesheet, a collapsed mobile documentation viewport, release-only long press, nested-scroll touch targeting, and targets initially covered by sticky/floating UI are actually rejected or correctly repositioned and observed. Broken self-test fixtures never count as component evidence.

**Component promotion rule:** generic harness journeys do not certify the candidate components they happen to exercise. Every `accepted` export must have a machine-readable certification record. G1 verifies the declared behavior-test owners exist; G6 verifies every declared browser scenario exists, explicitly claims the export, passes, and collectively covers all required axes. Stale certification records for non-accepted exports are forbidden.

### G7 — release

`pnpm release:check`

Extends G0..G6 with production Studio artifact checks and a fresh packed-tarball consumer install/typecheck/Node-import/Vite-build smoke. Release checks operate on the artifact users receive.

## Canonical commands

```bash
pnpm quality        # G0..G3: fast canonical development gate
pnpm verify         # G0..G6: full repository acceptance
pnpm release:check  # G0..G7: release artifact/consumer proof
pnpm gate:browser   # focused G5 + G6 production browser acceptance
```

Focused gates may be rerun while debugging, but a part cannot close on a focused rerun alone.

## Non-negotiable acceptance rules

1. **No grandfathering.** Existing exports begin as `candidate`.
2. **No fake coverage.** Metadata inference is not evidence of browser behavior.
3. **No marker gates.** A check may parse source structure or artifacts, but may not pass because a magic phrase exists in a file.
4. **No test weakening.** Repair production behavior or the test model; do not loosen assertions to make a gate green unless the old assertion was semantically wrong and the replacement proves the correct contract.
5. **No hidden compatibility debt.** Beta-stage breaking API cleanup is preferred over permanent aliases/shims when the old contract is wrong.
6. **No Studio exception.** Studio must dogfood the same public UI surface available to consumers.
7. **No platform impersonation.** Native/compositor authority stays with the host; this repository owns only host-neutral contracts and UI behavior.
8. **No release from source-only confidence.** Packed-artifact consumer proof is mandatory.
9. **Fix forward.** Failed validation preserves the working state for diagnosis; automated rollback is not part of the delivery flow.
10. **One definition of done.** A task is complete only when its code, tests, docs, Studio representation, applicable browser axes, and package boundary agree.
11. **No browser-evidence laundering.** Harness smoke touching a component does not certify that component; promotion requires a certification record binding behavior tests, explicit component-owned G6 scenarios and required axes.
12. **No downloaded-browser assumption.** Local/CI acceptance must run against an installed Chrome/Chromium or fail with an actionable browser-path requirement.

- G6 semantic contrast contract: readable tertiary/supporting text must satisfy WCAG AA in supported themes.


### UIR04 Icon completion invariant

G0 Visual rejects an accepted multi-state Icon implementation that lacks both owner-node animation completion and bounded fallback settlement. This protects transient-state convergence when CSS animation events are cancelled or suppressed, while sequence identity protects retargeted transitions from stale completion.

The same G0 gate also rejects root-coupled directional mirroring and icon-pack boundary drift: `@ontologyx/ui/icons` must remain a dedicated built subpath, the canonical package entry must not re-export the large vocabulary, declared static/animated counts must match source breadth, and pack sources may depend only on the canonical Icon definition contract.

- `check-browser-fixture-scope.mjs` — requires canonical Studio example scoping for G6 journeys.
