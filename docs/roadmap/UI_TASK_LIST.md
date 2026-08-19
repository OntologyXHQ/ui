# OntologyX UI — Rebuild Task List

**Reset date:** 2026-08-19
**Reset baseline:** `fa05bb1a829851ac83df6a956dbce091cc128819`
**Canonical package:** `@ontologyx/ui`
**Policy:** all pre-reset visual exports are implementation candidates. None are accepted merely because earlier roadmaps called them DONE/stable.

The old UIP00..UIP23 plan is historical extraction context only. This file is the only active UI delivery plan.

## Product architecture

Public visual dependency direction stays intentionally small:

```text
Foundations
    ↓
Primitives
    ↓
Components
    ↓
System UI
```

Shared engines such as interaction, focus, motion, gestures, scroll, editing, drag/drop, cursor, environment observation and portal coordination are internal infrastructure, not a fifth developer-facing visual layer. They may support higher layers but may not depend upward on Components/System UI.

Components are the primary developer-facing SDK. System UI is privileged composition for OXS-class hosts and must consume Components rather than bypassing them through Primitives.

## Delivery rules

- No fixed task quota per part. Parts close coherent ownership boundaries, not arbitrary counts.
- Existing source is untrusted until the owning part audits it from first principles.
- Every public visual export starts `candidate`; promotion to `accepted` is explicit and gate-backed.
- Every part updates Studio in the same delivery. Generic empty previews do not count.
- RTL, accessibility, keyboard, touch, responsive/container behavior, theme, state, and reduced-motion behavior are acceptance axes, not cleanup batches.
- API quality is part of implementation quality: names, defaults, controlled/uncontrolled semantics, polymorphism, composition and escape hatches must be intentional.
- Beta compatibility is not sacred. Wrong public APIs may be replaced cleanly before V1 instead of accumulating compatibility aliases.
- Host-native behavior stays outside this repository behind typed platform-neutral contracts.
- Full closure uses `pnpm verify`; releases use `pnpm release:check`.

## Status legend

- `DONE` — implemented and accepted under the new gate model.
- `ACTIVE` — part is open; completed and pending slices are recorded underneath.
- `NEXT` — immediate frontier.
- `TODO` — planned but not started.
- `BLOCKED` — cannot proceed until the named dependency is closed.

---

## UIR00 — Rebaseline, truth reset and gate constitution — DONE

Purpose: stop inheriting old completion claims and establish a gate system strong enough to rebuild on.

- `UI-0001` Reset the active roadmap/task list from zero; old UIP history becomes noncanonical reference only.
- `UI-0002` Replace `stable`/`provisional` catalog maturity claims with `candidate`; no visual export is grandfathered.
- `UI-0003` Define canonical G0..G7 quality/release gates and a single definition of done.
- `UI-0004` Replace patch-specific canonical checks with stable architecture/catalog/Studio gate owners.
- `UI-0005` Enforce real source-zone dependency direction and package/publication boundaries.
- `UI-0006` Purge unreachable legacy Studio pages/galleries and gate future Studio reachability.
- `UI-0007` Make accepted-catalog quality machine-enforced: docs, prop descriptions and real render fixture/example.
- `UI-0008` Add a fast tracked-source snapshot workflow for future review handoffs.

Acceptance: `pnpm quality`, `pnpm gate:studio`, typechecks/tests/build on the user workspace; Studio shows candidate status rather than false stability. No component is promoted to accepted in this part.

---

## UIR01 — Real browser acceptance harness — DONE

Purpose: create the evidence system required before any visual API can be accepted.

- `UI-0101` Add deterministic Chromium browser acceptance using the system/local browser where possible; no unnecessary browser download dependency.
- `UI-0102` Add accessibility scanning with serious/critical failure blocking plus semantic assertions that axe alone cannot prove.
- `UI-0103` Add keyboard/focus journeys: tab order, roving focus, activation, escape, focus restoration and visible focus.
- `UI-0104` Add pointer/touch journeys including cancellation, long press where owned, coarse pointer and synthesized-click suppression.
- `UI-0105` Add environment matrix helpers for RTL/LTR, theme, density, reduced motion, viewport/container widths and safe-area/occlusion inputs.
- `UI-0106` Add geometry/reflow assertions for zoom/narrow layouts without brittle pixel snapshots.
- `UI-0107` Make Studio component routes directly addressable and deterministic for browser fixtures.
- `UI-0108` Add browser gate to `pnpm verify`; accepted status remains impossible unless required browser evidence exists.

Acceptance: real production-Studio browser journeys emit source-bound G6 evidence; intentionally broken ephemeral fixtures prove the harness rejects axe blockers, invisible focus, global overflow, environment drift and missing deterministic routes. Generic harness journeys do not certify candidate components.

---

## UIR02 — Foundations from first principles — DONE

Purpose: freeze the semantic substrate before visual APIs are redesigned.

### UIR02-A — Semantic token architecture — DONE

- `UI-0201` Audit and redesign semantic color/material/elevation/shape/spacing/typography tokens; remove ornamental or duplicate roles.
  - public customization is a finite grouped semantic registry, not every internal CSS variable;
  - emphasis tones have independent fill/text/on-fill/soft/border roles;
  - token override values are explicit CSS strings rather than unit-guessing numbers;
  - `UiRoot` no longer paints ornamental brand gradients;
  - package CSS cannot bypass semantic colors with raw color literals outside `tokens.css`.

### UIR02-B — Environment semantics — DONE

- `UI-0202` Define scoped theme inheritance/customization with SSR-safe static CSS variables and typed token overrides.
  - preference and resolved color-scheme state are distinct; system/custom resolution cannot silently disagree with native control color scheme.
- `UI-0203` Define direction contract and logical-property policy; eliminate physical left/right assumptions from public styling.
  - auto direction resolves from the enclosing/document direction; box layout uses logical properties while physical viewport geometry remains engine-owned.
- `UI-0204` Define density, target-size and modality vocabulary without device sniffing.
  - auto density resolves from pointer precision; coarse-pointer target floors stay independent of visual density; modality remains interaction state.
- `UI-0205` Define viewport/container/adaptive semantics and centralize environment observation.
  - every root is measured as a container; adaptive bands derive from inline size and media-query stores are isolated per Window realm.
- `UI-0206` Define safe-area/occlusion contracts that accept host-neutral inputs.
  - persistent safe area and transient occlusion are separate logical explicit-unit inputs; Components avoid their combined environment inset.
- `UI-0207` Define reduced-motion/motion-preference behavior and semantic timing tokens.
  - system motion resolves through the shared runtime; CSS consumes only resolved full/reduced state so timing and lifecycle cannot drift.

### UIR02-C — UiRoot certification — DONE

- `UI-0208` Reaccept `UiRoot` only after nested roots, theme scopes, direction, environment and SSR behavior pass G0..G6.
  - nested roots are detected automatically; the public diagnostic `scope` prop was removed rather than preserved as a meaningless caller knob;
  - nested roots inherit environment/token values and can override them without sharing portal/overlay/runtime ownership;
  - media-query, modality, direction and resize observation resolve against the concrete owning Window/Document realm after mount;
  - server render uses deterministic fallbacks and hydration may reconcile real system capabilities without a recoverable mismatch;
  - accepted exports now require a machine-readable certification record that binds behavior-test ownership, named G6 scenarios and explicit acceptance axes;
  - `UiRoot` is the first post-reset visual export promoted from `candidate` to `accepted`.

Acceptance: dedicated behavior tests cover nested inheritance, independent portal hosts, SSR/hydration and multi-realm environment resolution; the production Studio G6 scenario proves nested modal ownership, focus restoration and accessibility from the public package. `UiRoot` remains accepted only while `docs/quality/CERTIFICATIONS.json`, G1, G3 and G6 agree.

---

## UIR03 — Layout primitives redesign — DONE

Purpose: make layout APIs genuinely useful instead of thin class wrappers.

### UIR03-A — Core structural flow — DONE

- `UI-0301` Redesign `Box` polymorphism and native-prop typing; define the intentional styling/escape-hatch contract.
  - `as` preserves intrinsic native prop typing while `style`/`color` are excluded from the Primitive escape hatch;
  - finite logical boundary props cover overflow, min-size, flex-child participation, self-alignment and Grid span without arbitrary CSS serialization;
  - `className` remains the explicit structural integration escape hatch and visual values stay token/prop-owned.
- `UI-0302` Redesign `Stack`/`Row`/`Wrap` around typed semantic gap/alignment/distribution behavior.
  - all three are polymorphic, use one logical flow vocabulary, add `around`/`evenly` distribution, and intentionally expose no reverse/order API that could diverge from accessibility order.
- `UI-0306` Define overflow/min-size/flex-child behavior needed by real nested app layouts.
  - core flow primitives share the same finite logical boundary contract; `minInlineSize=zero` is the safe default for nested flex/grid ownership.
- `UI-0307` Give every primitive a dedicated Studio page/example; family-wide demos cannot masquerade as component examples.
  - Box/Stack/Row/Wrap now have independent source-owned examples and G0 rejects shared certification examples.
- `UI-0308` Promote only individually certified layout primitives to `accepted`.
  - Box, Stack, Row and Wrap are accepted only through `layout-core.test.tsx`, machine-readable certification records and dedicated G6 layout journeys.

### UIR03-B — Grid and spacing boundaries — DONE

- `UI-0303` Redesign `Grid` for real column/minmax/auto-fit/span use cases without turning props into arbitrary CSS serialization.
  - fixed finite track counts `1..12` and intrinsic `auto-fit` share one API; semantic `tile | card | wide` minima feed bounded `minmax()` tracks;
  - Grid is polymorphic, inherits the common logical boundary contract, and child spanning stays explicitly owned by `Box.gridSpan` rather than arbitrary track strings or dense visual reordering.
- `UI-0304` Redesign `Container` for semantic max-width/readable/content/full-width composition.
  - `readable | content | wide | full` replaces ambiguous `compact`; the new `layout-readable` semantic Foundation token gives prose-width ownership a themeable/documented source rather than a Primitive hardcode;
  - Container is centered with logical inline sizing and remains bounded by its containing block.
- `UI-0305` Redesign `Inset`/`Spacer` around logical spacing and axis semantics.
  - Inset composes tokenized `space → inline/block → logical edge` precedence without physical direction props or arbitrary values;
  - Spacer reserves exactly one logical axis, is permanently `aria-hidden`, exposes no DOM prop bag, and cannot be made focusable/semantic accidentally.
- Complete `SafeArea` logical edge ownership against the UIR02 environment contract.
  - `block-start | inline-end | block-end | inline-start` can be selected independently or through logical shorthands; SafeArea consumes only persistent `--oxs-safe-*` inputs and never transient keyboard/occlusion variables.
- Give Grid/Container/Inset/SafeArea/Spacer independent examples, tests, G6 evidence and accepted certification before closing UIR03.
  - each export has its own Studio example, behavior owner, named browser scenario, required axes and certification record; all nine Layout exports are now `accepted`.

Acceptance: G0 rejects freeform/physical layout escape hatches, legacy pre-certification selectors, unsafe Spacer DOM props and SafeArea occlusion consumption. G1/G3/G4/G6 bind all nine Layout exports to dedicated source tests/examples/browser evidence. UIR03 is closed; UIR04 is the next frontier.

---

## UIR04 — Visual primitives: type, icon, surface — DONE

- `UI-0401` Rebuild Text/Heading/Label/Code semantics, truncation/wrapping, selectable text and bidi behavior.
- `UI-0402` Rebuild Icon contract: sizing, mirroring, decorative vs labeled semantics, current-color behavior, custom glyph integration, and first-class multi-state families with stable semantic states plus explicit transient transition states.
- `UI-0403` Rebuild Surface/Divider material, border, elevation and interactive-state boundaries.
- `UI-0404` Prove typography under font fallback, Persian/English mixed content, long strings and zoom/reflow.
- `UI-0405` Document every custom primitive prop and remove ambiguous styling knobs.
- `UI-0406` Reaccept visual primitives independently through G0..G6.
- `UI-0407` Ship a broad optional `@ontologyx/ui/icons` vocabulary with static semantic glyphs and typed multi-state animated families, while keeping the canonical package entry lean and local-direction mirroring correct.

Acceptance: Text/Heading/Label/Code expose bounded native semantics, tokenized type roles and explicit long-token reflow; Icon replaces generic spin with immutable state families, explicit transient transition states, interruption retargeting and resolved reduced-motion settlement; Surface stays a static visual boundary while Divider owns separator/decorative semantics, logical inset and tokenized tone/thickness. G0/G1/G3/G4/G6 bind all seven exports to dedicated examples, behavior ownership and browser evidence; the optional icon-pack subpath is additionally covered by breadth/package tests and a dedicated G6 Studio journey without becoming a new visual export. UIR04 is closed; UIR05-A input authority is now certified and UIR05-B overlay authority is the next frontier.

---

## UIR05 — Interaction/runtime kernel — IN PROGRESS

### UIR05-A — Input authority — DONE

- `UI-0501` Re-audit press authority across keyboard/pointer/touch cancellation, capture and disabled transitions. **DONE**
- `UI-0502` Rebuild focus ownership, restoration, roving focus and nested-root behavior. **DONE for input ownership; overlay restoration continues in UIR05-B.**
- `UI-0504` Rebuild typeahead/selection normalization shared utilities. **DONE**
- `UI-0506` Rebuild gesture arena ownership and competition rules without feature-local event arbitration. **DONE**
- `UI-0507A` Add adversarial input tests for disabled transitions, nested runtime scopes, delayed typeahead reset and realm-local focus. **DONE**
- `UI-0508A` Keep input engines internal/advanced; public Components consume them without promoting the engines onto the canonical SDK surface. **DONE**

Acceptance: each UiRoot owns an independent GestureArena while isolated fixtures retain a non-public fallback; Press and Pan cancel active transactions when disabled/unmounted; pointer continuation and focus inspection use the concrete owning Window/Document realm; Select and Menu consume one Unicode-normalized timestamp-driven TypeaheadController; Tabs/navigation consume shared single-selection normalization; G0 and dedicated G6 evidence bind cancellation, long-press and shared typeahead behavior. Public visual maturity remains accepted=17/candidate=83 because this slice certifies infrastructure, not Components.

### UIR05-B — Overlay authority — NEXT

- `UI-0503` Rebuild overlay coordination, portal ownership, inert/aria-hidden isolation and nested modal ordering.
- `UI-0507B` Add adversarial overlay tests for unmount, reparent, nested roots/documents, delayed dismissal and restoration lineage.
- `UI-0508B` Keep overlay coordination internal/advanced unless a public developer contract is clearly justified.

### UIR05-C — Motion authority + kernel closeout — TODO

- `UI-0505` Rebuild central motion clock/scheduling and reduced-motion authority.
- `UI-0507C` Add adversarial motion tests for realm scheduling, runtime replacement, delayed frames and interrupted transitions.
- `UI-0508C` Close the kernel boundary and keep scheduling/physics engines internal/advanced unless a public contract is justified.

---

## UIR06 — Actions and command controls — TODO

- `UI-0601` Rebuild Button API/state model including loading, disabled, press, leading/trailing content and form semantics.
- `UI-0602` Rebuild IconButton labeling, tooltip relationship and target sizing.
- `UI-0603` Rebuild ActionGroup/Toolbar composition, roving keyboard behavior and overflow responsibilities.
- `UI-0604` Normalize destructive/primary/quiet visual vocabulary without product-specific tones.
- `UI-0605` Prove pointer/touch/keyboard equivalence and cancellation in real browser acceptance.
- `UI-0606` Promote action controls only with dedicated examples and complete props docs.

---

## UIR07 — Fields, forms and text input — TODO

- `UI-0701` Rebuild Field ownership for label/description/error/required/disabled/read-only relationships.
- `UI-0702` Rebuild TextField controlled/uncontrolled semantics, prefix/suffix/actions and native form integration.
- `UI-0703` Rebuild SearchField semantics, clear behavior and composition-event safety.
- `UI-0704` Define secure-input rules so secrets are not copied/exposed by UI helpers.
- `UI-0705` Define host-neutral IME/composition/text-session contracts without pretending React owns native IME lifecycle.
- `UI-0706` Define keyboard/occlusion inputs as host adapters and prove visual response in Studio.
- `UI-0707` Test autofill, composition, selection, validation, reset and form submission semantics.
- `UI-0708` Reaccept field family only after native form behavior and browser axes pass.

---

## UIR08 — Selection and disclosure controls — TODO

- `UI-0801` Rebuild Checkbox/Radio/Switch/Toggle semantics and indeterminate/mixed states where applicable.
- `UI-0802` Rebuild ToggleGroup/Segmented controlled/uncontrolled and roving behavior.
- `UI-0803` Rebuild Tabs manual/automatic activation, panel relationships and invalid-selection recovery.
- `UI-0804` Rebuild Select trigger/listbox/typeahead/form validity/focus restoration from native semantics outward.
- `UI-0805` Rebuild Disclosure/Accordion state ownership and heading/region semantics.
- `UI-0806` Certify keyboard, touch, RTL and form/reset behavior before acceptance.

---

## UIR09 — Navigation and data presentation — TODO

- `UI-0901` Rebuild List/ListItem/ListSection semantics and trailing-action composition without nested interactivity.
- `UI-0902` Rebuild navigation items/breadcrumb/pagination or remove concepts that do not justify public ownership.
- `UI-0903` Rebuild AdaptiveNavigation only after its lower-level navigation contracts are accepted.
- `UI-0904` Rebuild data/list presentation contracts around semantic HTML and predictable empty/loading/error states.
- `UI-0905` Rebuild spatial TileGrid navigation from measured geometry with RTL-aware arrows.
- `UI-0906` Certify long content, localization, reorder and focus continuity.

---

## UIR10 — Overlays and feedback — TODO

- `UI-1001` Rebuild Dialog/Sheet ownership, initial focus, dismissal, nested modal and restoration semantics.
- `UI-1002` Rebuild Popover/Menu/Listbox/Tooltip positioning and collision behavior around the shared floating/overlay engine.
- `UI-1003` Rebuild Scrim and modality isolation without feature-owned portals.
- `UI-1004` Rebuild Toast lifecycle/upsert/timing/live-region policy.
- `UI-1005` Rebuild progress/loading/skeleton/feedback semantics with reduced-motion behavior.
- `UI-1006` Certify nested overlays, scroll lock, escape arbitration, outside interaction and RTL geometry.

---

## UIR11 — Scroll and motion — TODO

- `UI-1101` Rebuild ScrollView logical coordinates, ownership, native wheel chaining and scroll restoration.
- `UI-1102` Rebuild snap semantics for logical start/center/end and variable child geometry.
- `UI-1103` Rebuild Transition/shared-bounds APIs around stable lifecycle ownership and cleanup.
- `UI-1104` Prove reduced-motion behavior is semantic, not merely shorter duration.
- `UI-1105` Establish performance budgets for scroll/motion hot paths with measurable criteria.
- `UI-1106` Certify nested scroll, RTL, resize and interruption behavior.

---

## UIR12 — Gestures, drag/drop, editing and cursor — TODO

- `UI-1201` Rebuild pan/swipe/reveal/edge-pan hooks on the accepted gesture arena.
- `UI-1202` Rebuild drag/drop source/target lifecycle, preview coordinates and edge auto-scroll.
- `UI-1203` Rebuild editing/clipboard adapter ownership, session cleanup and race cancellation.
- `UI-1204` Rebuild cursor roles/themes/scale/hotspot/modality as host-neutral contracts.
- `UI-1205` Prove gesture competition with native scroll and text selection.
- `UI-1206` Keep privileged/native cursor application in the host; UI only exposes contracts/visual intent.

---

## UIR13 — Developer compositions and adaptive scaffolds — TODO

- `UI-1301` Audit every current composition; remove wrappers that add no semantic/behavioral value.
- `UI-1302` Rebuild card/section/empty-state/content-region compositions from accepted components.
- `UI-1303` Rebuild app bar/sidebar/split/scaffold contracts for container-driven adaptation.
- `UI-1304` Prove nested scroll ownership and min-size behavior in realistic app layouts.
- `UI-1305` Keep product meaning out of reusable compositions.
- `UI-1306` Add realistic Studio applications, not isolated placeholder boxes, as acceptance examples.

---

## UIR14 — System UI core — TODO

- `UI-1401` Re-audit the public System UI boundary; generic capability gaps move down to Components first.
- `UI-1402` Rebuild desktop/workspace/scaffold layout vocabulary only from accepted Components.
- `UI-1403` Rebuild launcher/application-browser layouts without owning product data/routing.
- `UI-1404` Rebuild system bars/docks/settings shell around host-neutral commands/state.
- `UI-1405` Prove System UI has zero direct Primitive imports.
- `UI-1406` Revalidate the real OXS consumer after every System API migration.

---

## UIR15 — Privileged System surfaces — TODO

- `UI-1501` Rebuild touch keyboard visual/state contract on accepted Components and input-session adapters.
- `UI-1502` Rebuild notification center/quick controls as host-neutral System compositions.
- `UI-1503` Rebuild OSD/transient surfaces with timing/accessibility/motion rules.
- `UI-1504` Define safe-area/occlusion behavior for privileged surfaces.
- `UI-1505` Prove ordinary feature code cannot accidentally take ownership of privileged System surfaces.
- `UI-1506` Revalidate OXS integration without moving compositor/native authority into React.

---

## UIR16 — Studio as a real product-quality SDK workbench — TODO

- `UI-1601` Redesign Studio information architecture around accepted/candidate/experimental status and layer/category navigation.
- `UI-1602` Give every public export a dedicated real preview; no family demo reused as a fake component example.
- `UI-1603` Generate useful API docs with complete JSDoc, defaults and controlled/uncontrolled guidance.
- `UI-1604` Replace inferred coverage badges with links/results from actual acceptance evidence.
- `UI-1605` Make environment controls compact, responsive, keyboard/touch usable and self-hosted on public Components.
- `UI-1606` Add search/deep-link/shareable state and robust error isolation.
- `UI-1607` Remove all remaining parallel visual implementations and unreachable Studio source.
- `UI-1608` Certify Studio itself through the browser gate.

---

## UIR17 — Cross-axis certification, package hardening and V1 freeze — TODO

- `UI-1701` Ensure every intended V1 public export is `accepted` or explicitly removed/experimental/deprecated.
- `UI-1702` Run full RTL/LTR, theme, density, responsive/container, touch/pointer, keyboard/focus, reduced-motion and accessibility matrix.
- `UI-1703` Run adversarial lifecycle tests: nested roots, unmount, reorder, delayed events, portal nesting, resize/zoom and interrupted interactions.
- `UI-1704` Freeze bundle/source/CSS budgets from measured V1 output rather than arbitrary historical ceilings.
- `UI-1705` Prove Node/SSR import safety, explicit CSS consumption, tree-shakeable ESM and no duplicate React/runtime dependency.
- `UI-1706` Prove fresh packed-tarball consumer install/types/Node import/Vite production build.
- `UI-1707` Remove stale beta compatibility paths/docs and reconcile README/API/release docs with actual behavior.
- `UI-1708` Revalidate OXS against the release candidate, publish the stable version, and move `latest` to stable.

V1 closes only when there are no unreviewed public visual exports pretending to be stable and the package/Studio/OXS consumer all agree on the same accepted API.
