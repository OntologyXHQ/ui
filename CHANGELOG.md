## UIR08 + UIR09 — selection/disclosure and navigation/data closeout

- Reaccepted the complete UIR08 selection/disclosure family: native Checkbox/Radio form-reset semantics, realm-owned Switch gesture settlement, ToggleButton/ToggleGroup/Segmented normalization, manual/automatic Tabs relationships, Select typeahead/form validity/focus, and semantic Disclosure/Accordion headings/regions.
- Reaccepted the UIR09 navigation/data family: native ul/li collections with explicit non-ready states, sibling trailing actions, anchor-preserving AdaptiveNavigation, and owner-realm measured TileGrid focus continuity across RTL/reorder.
- Kept Slider, AppBar, ApplicationItem and ContentState candidate until their owning roadmap batches; Breadcrumb/Pagination remain deliberately absent rather than speculative APIs.
- Added dedicated G0 contracts, behavior tests, Studio examples and five G6 browser certifications. Expected catalog frontier after full verification: accepted=45, candidate=55, UIR10 NEXT.

- Fixed generated catalog JSON semantic freshness after formatting.
# Changelog
- UIR07 TypeScript docs follow-up: native-form action rows now use the accepted `Wrap` primitive instead of passing a nonexistent `wrap` prop to the intentionally non-wrapping `Row` contract; source-wide UIR07 docs are audited against the UIR03 Layout API.
- UIR07 Biome/generated-output follow-up: removed the final unused imports and iterable-callback lint error, and taught the catalog generator to emit identifier-safe module member access so generated Studio catalog imports are lint-clean at the source.
- UIR07 Biome semantic follow-up: FieldGroup now renders native `fieldset`/`legend`, meaningful/decorative leading slots use explicit ARIA branches, and SearchField relies on native `type="search"` semantics without a redundant role.

## Unreleased — UIR07 Fields, forms and text input

- Reaccepted FieldGroup, FieldSection, TextField, SearchField and TextArea with dedicated examples, behavior ownership and three browser certifications; catalog maturity advances to accepted=26/candidate=74 and UIR08 becomes next.
- Preserved native controlled/uncontrolled input, autocomplete, required/disabled/read-only validity, FormData submission and reset behavior; explicit errors now publish aria-errormessage while field structure keeps labels/descriptions/affixes connected.
- Made SearchField composition-safe: clear/suggestion actions suspend during IME composition, ArrowDown does not leak a suggestion request, clear restores focus synchronously without borrowing ambient requestAnimationFrame, and trailing actions keep the accepted 44px target contract.
- Hardened secure text input: secure/password purpose always renders as password, copy/cut/drag export is cancelled, and composition preedit is redacted from both local editing observers and UiRoot host bridges.
- Formalized the host-neutral editable-text session descriptor (single/multiline, inputMode, enterKeyHint, read-only) without carrying committed text values or claiming native IME/keyboard lifecycle; realm-local synthetic clipboard input uses the owning Window.
- Fields now consume only combined logical environment insets as scroll margins so host-supplied keyboard occlusion can inform reveal/scroll geometry without moving keyboard ownership into React. Fixed TextArea duplicate editing keydown dispatch and added a permanent G0 field/text-input drift gate.

- Re-audited the entire G6 suite for stacked-Studio fixture ownership: every deep-linked example journey now consumes the canonical `#example-<id>` scope, legacy layout/visual queries and DOM polling are scoped, and a new G0 gate prevents this class of duplicate-preview drift from returning.
## UIR06 v6 — stacked Studio post-isolation browser evidence repair

- Repaired the cross-root overlay authority G6 journey so modal isolation is measured from stable UiRoot DOM identities after the trigger becomes intentionally inert/absent from the accessibility tree.
- Added explicit example-readiness checks and a G0 regression invariant preventing accessibility-role locators from being re-resolved for post-isolation DOM evidence.

## Unreleased — UIR06 closeout follow-up: stacked Studio + Canvas OX renderer

- Browser-fixture scoping follow-up: stacked Studio deliberately keeps overview, examples, state samples and playground mounted together, so `gotoCatalog(..., example)` now returns the exact canonical `#example-<id>` fixture for component-behavior journeys instead of the whole workbench. Dialog/Popover/UiRoot/ContextMenu triggers are scoped likewise, and the legacy pointer-cancellation journey now uses the accepted Button contract rather than the removed Favorite ToggleButton preview.
- Accessibility follow-up: the horizontally scrollable generated API table is now a named keyboard-focusable region with tokenized focus-visible treatment; G4 and browser Studio evidence reject regressions back to an inaccessible overflow container.
- Fixed the final legacy SystemKeyboard Button variant consumer (`filled/soft/ghost` → `primary/secondary/quiet`) and strengthened the G0 Actions gate to scan all UI/Studio TSX consumers so legacy action vocabulary cannot hide outside Button itself.
- Rebuilt the generated Studio detail view as one stacked Overview → API → Examples → Playground reading flow. Historical `tab` routes remain deterministic section/deep-link keys, but Studio chrome no longer renders Tabs/TabPanel; headings, supporting copy, labels and code use the public OntologyX typography primitives.
- Moved the browser roving-focus journey from Studio chrome to the real public Tabs example and made the Studio route journey certify that all four documentation sections remain mounted/visible with zero tablists.
- Added `Spinner renderer="svg|canvas"`: SVG remains the lightweight default and Button loading stays SVG, while the optional Canvas backend is lazy-loaded, realm-local, ResizeObserver physical-box sized and scheduled exclusively through the owning UiRoot MotionClock. The canonical Spinner example toggles one renderer at a time and G6 verifies Canvas motion/backing-store behavior without duplicating the mark.

## Unreleased — UIR06 Actions and command controls

- Reaccepted Button, IconButton, ActionGroup and Toolbar with dedicated examples, behavior ownership and browser certification; catalog maturity advances to accepted=21/candidate=79 while ToggleButton remains candidate for UIR08.
- Replaced legacy ghost/soft/filled + danger Button vocabulary with quiet/secondary/primary emphasis and independent neutral/destructive intent; migrated internal consumers to the canonical action language.
- Button now documents/owns explicit native type, form, loading/disabled press cancellation, logical decorative slots and accessible pending-name behavior.
- IconButton now requires its accessible label, links supplemental tooltip text through aria-describedby, preserves optional toggle state and inherits Button target/loading semantics.
- ActionGroup no longer hides actions through container collapse. Toolbar owns orientation-aware roving focus, Home/End, logical RTL arrows and a pinned caller-owned overflow slot without inventing overflow policy.
- Added G0 action drift protection plus dedicated G6 action journeys.

## Unreleased — UIR05 runtime authority closeout

- UIR05-B/C browser follow-up: separated cross-root coexistence/visual-stacking evidence from outside-pointer dismissal semantics. The dedicated authority fixture now keeps both root-local modals open with `dismissOnOutsidePress={false}`, while runtime tests continue to prove document-top-most outside-pointer arbitration; G6 first proves modal A survives opening B before comparing independent portal hosts and Escape order.
- UIR05-B/C TypeScript follow-up: realm iframe keyboard construction now preserves the concrete Window/global constructor type, fake frame-host iteration narrows empty queues before deleting frame handles, and FramePerformanceMonitor subscriptions expose cleanup functions that return void rather than leaking Set.delete booleans into React effect destructors.
- Closed UIR05-B/C together after the input-authority slice: overlay modal/isolation/scroll state remains per-UiRoot, while Escape and outside-pointer arbitration is handled once per concrete Document realm instead of by per-overlay listeners.
- Made overlay lifecycle realm-local end to end: activeElement, Node checks, autofocus scheduling and focus restoration derive from the committed layer/surface/anchor owner Document/Window; modal registration moved into layout lifecycle to avoid pre-isolation focus flashes.
- Rebuilt MotionClock around an injected Window frame host; RAF, delayed cleanup timers, PerformanceObserver instrumentation and spring computed-style reads no longer borrow ambient globals from another realm. SharedBounds expiry is owned and cancelled by the root motion clock.
- Added adversarial overlay broker tests across independent UiRoots and iframe Documents plus motion tests for realm-host scheduling, runtime replacement, delayed timer disposal and owner-realm spring token reads.
- Added dedicated Studio/G6 authority fixtures proving cross-root portal isolation + Escape order and nested motion runtimes + interruption/reduced-motion convergence. Runtime kernel certification is now closed while visual catalog maturity remains accepted=17/candidate=83.

## OX loading presentation follow-up

- Spinner now exposes a `hero` size for first-entry/boot loading with stronger O/X/echo stroke weights while preserving the same heartbeat choreography and reduced-motion behavior.
- The Spinner Studio example now shows one canonical OX mark in a wide boot-stage presentation instead of duplicating the mark through a loading Button.
- Browser certification now rejects duplicate Spinner example marks and verifies hero-scale geometry/stroke weight before sampling the heartbeat motion.

- OX heartbeat seam-evidence follow-up: corrected G6 to distinguish authored keyframe endpoints from the wrapped `currentTime === duration` state of an infinite CSS animation; certification now proves 0→-100 pathLength endpoint equivalence, pre-seam modular convergence, and exact wrapped restart without weakening the visual continuity requirement.
- OX heartbeat loading motion: evolved the applied orbital-breathe loader into a written-mark choreography—two independently drawn X strokes using the refined OX geometry, an indeterminate O-ring that closes around the mark, a strong two-beat heartbeat with paired echo rings, then a release/unwrite phase whose terminal dash phase is equivalent to the next loop start; reduced motion remains a static complete OX mark.
- Brand loading-motion refinement: rebuilt the OX loader as a seamless non-linear orbital-breathe cycle with a dynamically expanding/contracting O arc, synchronized X choreography, matched static/loading geometry and no linear rotation reset at the loop boundary.
- Brand loading-mark follow-up: added a reusable OntologyX O+X mark to the optional icon pack and replaced the duplicate generic Button/Spinner rings with one shared O-ring + orbit + X loader; continuous motion uses semantic motion tokens and resolves to a static branded mark under UiRoot reduced-motion policy.
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
