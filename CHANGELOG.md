# Changelog

- UIR05-A input authority: root-scoped GestureArena ownership, disabled press/pan cancellation, realm-local focus and pointer continuation, shared Unicode typeahead and single-selection normalization, adversarial tests, G0 contract and dedicated browser evidence.
  - Menu now owns enabled MenuItem activation closure: native mouse/Enter/Space activation runs item callbacks first, then closes through the canonical `requestOpenChange(false)` path so focus restoration cannot be bypassed by consumer-local state setters; `preventDefault()` can intentionally keep the menu open.
  - G6 shared-typeahead evidence is scoped to the active catalog workbench, so duplicate accessible names in the global Studio environment toolbar cannot contaminate component certification.
## Unreleased — UIR04 visual primitives reacceptance

- UIR04 Icon-pack closeout: directional mirroring now resolves through inherited logical-direction transform tokens published by nested LTR/RTL boundaries, avoiding SVG-local `:dir()` dependence while preserving nested overrides. Added the optional `@ontologyx/ui/icons` entry with 160 distinct static glyph definitions exposed through 244 semantic exports/aliases plus 22 typed multi-state animated families, all self-contained on `defineUiIcon`; the canonical `@ontologyx/ui` entry does not re-export the pack. Added package/build/type boundaries, Studio breadth preview, unit/type coverage, G0 count/isolation invariants and a dedicated G6 pack journey.

- UIR04 reduced-motion follow-up: desired Icon state now reconciles in a pre-paint layout effect so the prior stable state cannot leak across a committed state change; reduced-motion G6 convergence now waits for the exact requested stable semantic + visual state instead of accepting any stable phase. The Primitive remains layer-correct: reduced visual timing is still projected through UiRoot/CSS rather than importing the Motion engine into Primitives.

- UIR04 follow-up: Icon transition completion is now deadlock-safe. The active transition node owns native `animationend`/`animationcancel` boundaries, while a realm-scoped watchdog derived from computed animation timing settles the same sequence if the browser suppresses or cancels the CSS event. Stale completion from interrupted transitions is ignored by sequence identity.

- Closed UIR04 and promoted `Text`, `Heading`, `Label`, `Code`, `Icon`, `Surface`, and `Divider` to `accepted` with dedicated examples, behavior ownership and component-owned G6 certification.
- Rebuilt typography around bounded native semantics, semantic tone/wrap/selection policy and explicit `overflowWrap="anywhere"` for long unbreakable content; removed the legacy display-heading content-width cap and added mixed Persian/English, font-fallback, narrow reflow and browser zoom evidence.
- Replaced Icon's generic `animated` spin knob with immutable multi-state glyph families: stable semantic states, explicit transient transition-state identities, optional transient glyphs, finite motion treatments, interruption retargeting, current-color rendering and resolved UiRoot reduced-motion settlement are now part of the Icon contract.
- Added the built-in `playback` family as the canonical stateful reference (`play → pausing → pause`, `pause → playing → play`) while preserving static `defineUiIcon({ paths })` shorthand and semantic RTL mirroring.
- Reaccepted Surface as a static material/elevation/radius/border/clip boundary with no Primitive hover/pressed/selected state ownership; extended Divider with semantic border tone/thickness while keeping logical inset and semantic-vs-decorative separator behavior explicit.
- Added the stable G0 visual-primitive gate plus three production-browser journeys covering typography/bidi/reflow, Icon multi-state/reduced-motion/interruption behavior, and Surface/Divider token/accessibility boundaries.

## Unreleased — UIR03 layout primitives redesign

- UIR03-B browser follow-up: corrected the shared catalog deep-link harness so route activation is certified by attached target + `data-active` + active tab-panel ownership, while component/example visibility remains the responsibility of each semantic G6 assertion; a zero-layout diagnostic wrapper can no longer create a false product failure.
- Studio simulated viewport presets now drive the self-hosted workbench through `@container oxs-ui`; browser-width media queries can no longer collapse phone examples inside a desktop acceptance context.
- Closed UIR03-B and UIR03 as a whole: `Grid`, `Container`, `Inset`, `SafeArea`, and `Spacer` now join Box/Stack/Row/Wrap as individually certified `accepted` Layout primitives.
- Rebuilt Grid around finite `1..12` tracks or intrinsic `auto-fit` + semantic minmax minima; arbitrary CSS track strings, dense/reverse ordering and style serialization remain outside the public contract.
- Replaced ambiguous Container `compact` with semantic `readable | content | wide | full` tiers and added the public `layout-readable` Foundation token so readable width is token-owned rather than hard-coded inside a Primitive.
- Rebuilt Inset around deterministic tokenized all → axis → logical-edge precedence and completed SafeArea with four logical edges plus explicit combinations while keeping transient occlusion out of SafeArea ownership.
- Tightened Spacer into a permanently `aria-hidden`, non-focusable one-axis decorative primitive with no native DOM prop bag; parent `gap` remains preferred when sibling relationships own spacing.
- Added independent Studio fixtures, behavior tests, certification records and five dedicated G6 journeys for Grid tracks/span/reflow, Container width tiers, RTL Inset precedence, SafeArea persistent-vs-occlusion isolation and Spacer geometry/accessibility.

- Closed UIR03-A core structural flow: `Box`, `Stack`, `Row`, and `Wrap` now expose typed intrinsic polymorphism plus a finite logical boundary contract for overflow, min-size, flex-child participation, self-alignment and Grid span; arbitrary inline style/color serialization and visual order reversal remain outside the Primitive API.
- Replaced the old shared Layout vocabulary demo with dedicated Box/Stack/Row/Wrap Studio examples and added a stable G0 layout gate that rejects physical/freeform escape hatches and shared certification fixtures.
- Added `layout-core.test.tsx` type/behavior ownership and component-owned G6 certification for semantic polymorphism, nested overflow/min-size safety, RTL logical Row ordering and intrinsic Wrap reflow.
- Promoted Box, Stack, Row and Wrap from `candidate` to `accepted` as the first UIR03-A slice; UIR03-B now completes the remaining Layout family.

## Unreleased — UIR02 foundations reacceptance

- Closed UIR02-C and promoted `UiRoot` as the first post-reset `accepted` visual export. Nested roots are inferred automatically instead of exposing a diagnostic `scope` prop, inherit environment/token state by default, and keep portal/overlay runtime ownership local to the nearest root.
- Added SSR/hydration and multi-Window/Document realm certification: media queries, modality, direction, reduced motion and ResizeObserver ownership now follow the concrete root realm after mount while server output retains deterministic fallbacks.
- Added `docs/quality/CERTIFICATIONS.json`; accepted exports must bind behavior-test owners, named G6 scenarios and required acceptance axes, and G1/G6 reject stale or incomplete certification records.
- Added a public Studio nested-root certification example and G6 journey proving environment inheritance/override, root-local portal ownership, modal isolation, focus restoration and axe-clean behavior.

- Closed UIR02-B environment semantics: UiRoot now separates preferences from resolved color-scheme/direction/density/modality/pointer/motion runtime state, auto density resolves from pointer precision without device names, and adaptive bands derive from measured container inline size.
- Split persistent logical safe-area inputs from transient host occlusion, added combined environment inset variables for reachable Component overlays/feedback, and changed inset values to explicit CSS lengths rather than guessed numeric pixels.
- Unified reduced-motion projection so CSS consumes the same resolved `full | reduced` state as the motion runtime instead of maintaining a second `system` media branch.
- Scoped media-query/modality/document-direction observation to concrete browser realms and added G0 environment checks against device sniffing, viewport-size responsive media queries, unresolved auto/system CSS state, and physical inline box properties.
- Strengthened G6 environment/reflow evidence with resolved/preference attributes, adaptive-band assertions, separate occlusion projection, and keyboard-occlusion vs safe-area coverage.

- UIR02-A follow-up: replaced the browser-console-dependent focused `aria-hidden` self-test with a DOM-semantic invariant that directly rejects focus retained inside `aria-hidden`/`inert` ancestors; real browser warnings remain captured as diagnostics, but certification no longer depends on Chromium exposing implementation warnings through Playwright console events.
- Closed UIR02-A semantic token architecture: public theme overrides are grouped and finite, semantic emphasis tones split fill/text/on-fill/soft/border roles, override values are explicit CSS strings, and raw package color literals outside `tokens.css` are gated; stale semantic color references in the package or self-hosted Studio are rejected.
- Removed the ornamental root accent-gradient/glow from the foundation substrate; `UiRoot` now paints the semantic canvas only.
- Added complete light/dark semantic roles for accent/danger/success/warning and corrected filled-danger/on-fill plus success/warning badge usage.
- Added a real Studio semantic-token example and exported machine-readable token groups for developer tooling.
- Repaired modal overlay focus ordering so focus enters a committed modal Popover/Dialog surface before sibling `inert` + `aria-hidden` isolation; browser diagnostics now block Chrome's focused-descendant `aria-hidden` warning and G6 has a dedicated modal Popover regression journey.
- Marked the G6 evidence system as established for future component promotion; `pnpm verify` still reruns G6 on every full acceptance.

## Unreleased — UIR01 browser acceptance
- UIR01 follow-up: fixed the real phone Studio layout collapse exposed by browser hit-testing: the nine environment selectors now stay in one horizontally scrollable public Toolbar strip instead of consuming the workspace vertically, and G6 rejects a documentation viewport smaller than four 44px touch-target rows.
- UIR01 follow-up: made CDP touch targeting distinguish intersection visibility from hit-test visibility by explicitly centering the real target in nested scroll containers before deriving coordinates; G6 now reports the concrete occluding element if ownership is still lost, and an adversarial fixture proves recovery from a fully-intersecting but center-occluded target.
- UIR01 follow-up: made touch long-press acceptance target the deterministic ContextMenu example, scroll the real target into its nested ScrollView viewport, and assert browser hit-test ownership before CDP touch dispatch; added an adversarial nested-scroll self-test so offscreen geometry cannot masquerade as a product long-press failure.
- UIR01 follow-up: corrected semantic tertiary text contrast after the real-browser Axe gate exposed sub-AA supporting copy in the Studio and public List components; the shared readable tertiary token now has AA-safe light/dark contrast and the browser harness includes an adversarial color-contrast self-test.

- Fixed the Studio browser-host composition contract so the stylesheet-neutral public package is explicitly styled via `@ontologyx/ui/styles.css`; G4 and an adversarial G6 self-test now prevent unstyled public UI from being certified.
- Studio-loaded docs examples now instantiate runtime UI exclusively through the public `@ontologyx/ui` package, preventing source/package context splits (notably portal/overlay ownership); G4 enforces the boundary and G6 fails fast on isolated example-load errors.

- Added G6 production browser acceptance backed by `playwright-core` and an installed system Chrome/Chromium; no browser download dependency is introduced.
- Added blocking serious/critical axe scans plus semantic keyboard/focus, modal isolation/restoration, pointer cancellation, touch long-press, environment and reflow assertions.
- Added adversarial browser-harness self-tests using intentionally broken ephemeral fixtures that never count as component certification.
- Added source-bound JSON evidence under ignored `artifacts/browser-acceptance/` and enforced explicit component-owned G6 coverage before any future export may remain `accepted`.
- Made Studio workbench routes explicitly identifiable/deterministic for browser fixtures while preserving public `@ontologyx/ui` self-hosting.
- Removed stale pre-rename `@oxs/ui` Vite aliases from the standalone Studio.

## Unreleased — UI rebaseline

- Reset the active UI roadmap from zero; pre-reset implementation is candidate material, not accepted completion.
- Replaced legacy `stable`/`provisional` catalog maturity claims with `candidate`.
- Introduced stable architecture/catalog/type/behavior/Studio/build/release gate ownership.
- Removed unreachable legacy Studio pages/galleries and the synthetic fixture-matrix gate.
- Added `pnpm verify` and a fast `pnpm snapshot` tracked-source handoff command.

## 0.1.0-beta.1 — OntologyX public beta

- Published the standalone UI platform as `@ontologyx/ui` under the OntologyX npm organization.
- Adopted the MIT License and canonical `OntologyXHQ/ui` repository identity.
- Kept published JavaScript stylesheet-neutral and CSS host-owned through `@ontologyx/ui/styles.css`.
- Preserved the 100-export self-hosted Studio/catalog contract and UIP15 System Keyboard frontier.
- Added public beta/`latest` release-channel handling, npm Trusted Publishing readiness, and GitHub Release creation.

## 0.1.0 — Standalone extraction seed

- Extracted the UI platform and self-hosted UI Studio from OXS.
- Converted package exports from source paths to built ESM/declaration/CSS artifacts.
- Added pack validation and real tarball consumer smoke.
- Preserved the 100-export generated Studio/catalog contract and UIP15 System Keyboard frontier.
- Established host-neutral boundaries for UIP16+.
