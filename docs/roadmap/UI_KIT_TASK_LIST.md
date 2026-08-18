> **Standalone extraction note — 2026-08-18**
>
> This roadmap was carried out of the OXS product repository at the UIP15 frontier.
> From UIP16 onward, reusable UI contracts/visuals/runtime-neutral behavior belong here; compositor, Wayland, native IME, physical-keyboard detection and other host implementations remain consumer-owned integrations. The canonical standalone gate is `pnpm quality`.

# OntologyX UI Platform — Patch Delivery Task List

> Standalone UI-only delivery roadmap. This file does not participate in the root OXS backlog, backend/runtime batches, hardware certification, or root planning/evidence gates. While this track is active, UI delivery is driven by the patch IDs `UIP00..UIP23` and atomic task IDs `OXUI-001..OXUI-144` in this document.

## 1. Delivery principle: define once, build upward once

The UI Platform must be built as a dependency stack, not as a sequence of retrofits.

Target production dependency direction:

```text
Foundations
    ↓
Primitives
    ↓
Components
    ↓
System UI
    ↓
Shell / product features
```

The execution model deliberately uses two directions:

1. **Requirements are collected top-down once.** `UIP00` inventories the current Shell/System UI and developer-facing needs before lower layers are rebuilt. This creates a capability demand map so lower layers know what higher layers will require.
2. **Implementation proceeds bottom-up once.** After the contracts are frozen, Foundations are built first, then shared interaction/runtime services, then Primitives, then Components, then System UI.

This avoids the common failure mode where RTL, touch, responsive behavior, accessibility, or a missing System capability causes repeated rewrites of already-finished components.

### 1.1 No-retrofit rule

RTL, responsive/adaptive behavior, touch-first interaction, accessibility, theming, documentation, and state coverage are **not later cleanup batches**. They are acceptance axes of every public visual item from the moment it is created or migrated.

A public component is not `DONE` until the applicable matrix is closed in the same patch:

```text
theme × direction × size/container × modality × keyboard/focus × state × motion preference
```

A later patch may consume a completed lower-layer API, but it must not redesign that API casually. Any required lower-layer API change must be justified as a capability gap missed by the frozen demand map and must preserve compatibility or perform an explicit migration in the same patch.

### 1.2 Patch size

- Default: **6 atomic tasks per patch**.
- Architectural patches may internally contain several file changes, but they still close one coherent dependency boundary.
- A patch may be split only if validation shows the scope cannot be made independently safe.
- Do not create 1–2 task micro-patches for ordinary work.
- Do not combine unrelated upper- and lower-layer work merely to make a patch larger.

This roadmap is therefore **24 delivery patches / 144 atomic tasks**. `UIP00..UIP14` form the original dependency spine; `UIP15..UIP23` extend the same architecture through self-hosting proof, privileged input surfaces, cursor/system-surface completion, product migration, certification and V1 closeout.

### 1.3 Mandatory Studio presentation rule

Every patch must end with a polished, discoverable Studio presentation of what that patch added or changed. A small fixed set of meaningful UI delivery checks runs after apply, but the workspace remains fix-forward: failed checks preserve all applied changes.

### 1.4 No automatic workspace rollback during the focused UI track

UI patch apply tooling preserves applied source changes. Do not use `git reset`, `git restore`, `git clean`, `git revert`, `git stash`, or workspace `git checkout` as an automatic repair/rollback mechanism. Fix forward in the current working tree. Detached checkout inside the dedicated external Servo source cache is not workspace rollback and remains allowed.

A patch is not `DONE` until its relevant Foundations, Primitives, Components, interactions, runtime services, or System UI layouts can be inspected in `pnpm dev ui` with representative states/interactions appropriate to that patch. Architecture/ownership patches must present their architecture and migration result visually as well.

The presentation belongs to the same patch; do not defer it to `UIP13`. `UIP13` completes the generated Studio workbench but does not retroactively document invisible earlier delivery.

### 1.5 Small, stable delivery gates

UI patches use a deliberately small gate set that protects real code behavior without growing a patch-specific checklist:

1. `pnpm quality` — stable architecture/ownership invariants only.
2. `pnpm --filter @ontologyx/ui check` — TypeScript integrity of the production UI package.
3. `pnpm --filter @ontologyx/ui test` — focused UI package behavior/regression tests.
4. `pnpm --filter @ontologyx/ui-studio check` and `pnpm --filter @ontologyx/ui-studio build` — prove the mandatory Studio presentation compiles and bundles.
5. `docs:generate` / `docs:check` only when a patch changes public visual exports, colocated docs, or catalog generation.

Do not add root planning/evidence gates, formatter-only blockers, task-specific text/baseline guards, or one-off validation scripts to this chain. Gate failure never rolls back source changes; fix forward in place and rerun the same stable gates.

The focused acceptance loop is: **apply → stable UI gates → open `pnpm dev ui` → inspect the visible result → fix forward if needed**.

### 1.6 Stable `pnpm quality` architecture contract

`pnpm quality` is a small, stable architecture-policy command, not an accumulating patch checklist. It checks only long-lived code ownership invariants: layer dependency direction, public/deep-import boundaries, reusable control ownership, logical RTL-safe styling, lightweight/no-required-CSS-in-JS production runtime, centralized environment observation, and centralized cursor styling. Formatting, compilation, tests, builds, generated-doc freshness, planning/evidence, and patch-specific assertions do not belong inside `pnpm quality`. New UI patches must fit the existing quality model rather than append task-specific checks.

## 2. Canonical layer model

### 2.1 Foundations

Own semantic, mostly non-visual platform contracts:

- semantic design tokens;
- theme and scoped customization;
- typography/shape/material/elevation scales;
- logical direction and bidirectionality;
- density and adaptive/container semantics;
- safe-area and occlusion/inset semantics;
- input modality and touch-target policy;
- motion preference and accessibility state vocabulary.

Foundations should be as close to zero-runtime as practical. Static CSS + CSS custom properties + typed contracts are preferred over runtime style generation.

### 2.2 Primitives

The minimal visual vocabulary used to implement Components. Primitives may express layout, typography, iconography, surfaces, spacing, and structural composition, but they do not own application or OXS product semantics.

Application developers should rarely need to build complete experiences directly from this layer.

### 2.3 Components

The main developer-facing UI SDK: the layer analogous in responsibility to the reusable controls/composables developers expect from Android/iOS UI frameworks.

Components own interaction behavior, accessible semantics, touch behavior, responsive behavior, directionality, state vocabulary, and integration with shared UI engines.

Examples include actions, fields, selection controls, lists, tabs, navigation structures, sheets, menus, dialogs, feedback, scroll containers, cards, toolbars, and generic app scaffolds.

### 2.4 System UI

OXS-specific shell composition. System UI may use **Components and System-owned helpers**, but may not import Primitives directly.

Examples include desktop/workspace scaffolds, launcher layout, system bars/docks, settings shell, notification/quick-settings surfaces, OSD/transient surfaces, and privileged system-surface host layouts.

If System UI needs a generic capability, that capability belongs in Components first.

## 3. Target repository shape

```text
packages/ui/                         # @ontologyx/ui — production UI platform
├── src/
│   ├── foundations/
│   ├── primitives/
│   │   └── internal/
│   ├── components/
│   │   └── internal/
│   ├── system/
│   │   └── internal/
│   └── index.ts
└── package.json

apps/ui-studio/                      # dev-only generated UI Studio
├── src/
│   ├── app/
│   ├── catalog/
│   ├── navigation/
│   └── playground/
└── package.json

apps/shell/                          # product consumer
└── imports public @ontologyx/ui APIs
```

The exact migration can be staged, but ownership is final. `pnpm dev ui` remains the stable UI development workflow and the Studio remains development-only.

## 4. Dependency and ownership rules

Allowed direction:

```text
foundations -> nothing below it
primitives  -> foundations
components  -> foundations + primitives + component-owned internal support
system      -> public components + explicitly system-support component contracts
shell       -> public components + public system exports
```

Forbidden:

```text
system   -> primitives
shell    -> primitives/internal
shell    -> components/internal
feature  -> raw reusable visual CSS/DOM when an @ontologyx/ui owner exists
studio   -> production dependency graph
```

Layer-local `internal/` code exists so a layer can support itself and, where explicitly designed, the immediately higher layer without leaking implementation helpers into the public product API.

## 5. Dynamic Studio contract

The Studio is generated from source truth, not hand-maintained navigation.

```text
public exports
+ TypeScript/JSDoc prop information
+ colocated *.docs.tsx metadata/examples
                    ↓
           catalog generator/checker
                    ↓
      deterministic generated catalog
                    ↓
menu + detail pages + prop tables + examples + search + playground
```

Requirements:

- menu/category membership is generated;
- prop names/types/optionality/JSDoc/deprecation/default metadata come from TypeScript where practical;
- examples are colocated and lazy-loaded;
- every example/page is fault-isolated;
- public visual exports without required docs fail UI validation;
- stale generated catalog output fails validation;
- Studio dependencies never enter the production UI graph.

## 6. Patch dependency graph

```text
UIP00  Platform spine + capability demand map
  ↓
UIP01  Generated catalog + UI-only verification spine
  ↓
UIP02  Foundations + environment contract
  ↓
UIP03  Shared interaction kernel
  ↓
UIP04  Specialized runtime services
  ↓
UIP05  Primitive layer
  ↓
UIP06  Components: actions + selection
  ↓
UIP07  Components: fields + forms
  ↓
UIP08  Components: data + navigation
  ↓
UIP09  Components: overlays + feedback
  ↓
UIP10  Components: developer compositions
  ↓
UIP11  System UI boundary + migration floor
  ↓
UIP12  System layout library
  ↓
UIP13  Studio self-hosting + generated workbench
  ↓
UIP14  First-stage cleanup + measured hardening
  ↓
UIP15  System touch keyboard surface
  ↓
UIP16  Text input + IME + secure input + occlusion integration
  ↓
UIP17  System cursor completion
  ↓
UIP18  Notifications + transient System surfaces
  ↓
UIP19  Launcher/application presentation migration
  ↓
UIP20  Workspace/window chrome migration
  ↓
UIP21  Cross-axis System certification
  ↓
UIP22  Legacy/API/bundle cleanup
  ↓
UIP23  UI Platform V1 closeout
```

`UIP00..UIP04` are the **platform spine**. Once those are closed, ordinary component work must not require redesigning them.

`UIP05..UIP10` build the reusable developer platform exactly once, with all cross-cutting acceptance axes closed per patch.

`UIP11..UIP12` are allowed to consume Components only. They are intentionally late so System UI does not force ad-hoc primitive bypasses.

`UIP13` makes the Studio a real self-hosting consumer: all reusable visible Studio chrome and interactions must dogfood public `@ontologyx/ui` instead of maintaining a parallel control/style system.

`UIP14` is a first hardening checkpoint, not V1 closeout. It removes only paths whose replacement is already complete and records budgets before privileged/system-surface expansion.

`UIP15..UIP20` complete privileged input/system surfaces and migrate OXS-specific product surfaces on the frozen Component/System boundaries. `UIP21..UIP23` certify, clean and close the UI Platform only after those surfaces are real.

## 7. Patch delivery ledger

| Patch | Status | Tasks | Depends on | Delivery intent | Planned ZIP |
|---|---|---:|---|---|---|
| `UIP00` | DONE | 6 | — | Freeze architecture and top-down capability demand map. | `oxs-uip00-platform-spine.zip` |
| `UIP01` | DONE | 6 | UIP00 | Make docs/catalog/validation automatic before UI expansion. | `oxs-uip01-catalog-spine-v1-no-rollback.zip` |
| `UIP02` | DONE | 6 | UIP01 | Freeze theme/direction/adaptive/modality environment contracts. | `oxs-uip02-foundations-environment.zip` |
| `UIP03` | DONE | 6 | UIP02 | Freeze shared press/focus/gesture/motion/overlay behavior. | `oxs-uip03-interaction-kernel.zip` |
| `UIP04` | DONE | 6 | UIP03 | Reconcile scroll/editing/DnD/cursor/runtime support once. | `oxs-uip04-runtime-services.zip` |
| `UIP05` | DONE | 6 | UIP04 | Build the complete minimal Primitive vocabulary once. | `oxs-uip05-primitives.zip` |
| `UIP06` | DONE | 6 | UIP05 | Close actions and selection Components. | `oxs-uip06-actions-selection.zip` |
| `UIP07` | DONE | 6 | UIP06 | Close fields and form Components. | `oxs-uip07-fields-forms.zip` |
| `UIP08` | DONE | 6 | UIP07 | Close reusable data and navigation Components. | `oxs-uip08-data-navigation.zip` |
| `UIP09` | DONE | 6 | UIP08 | Close overlays and transient feedback Components. | `oxs-uip09-overlays-feedback.zip` |
| `UIP10` | DONE | 6 | UIP09 | Close generic developer compositions needed by System UI. | `oxs-uip10-developer-compositions.zip` |
| `UIP11` | DONE | 6 | UIP10 | Establish System UI ownership and migrate current generic/system seams. | `oxs-uip11-system-boundary.zip` |
| `UIP12` | DONE | 6 | UIP11 | Build OXS System layout vocabulary only from Components. | `oxs-uip12-system-layouts-v1-stable-gates.zip` |
| `UIP13` | DONE | 6 | UIP12 | Make Studio fully self-hosting while completing generated navigation/playground/coverage UX. | `oxs-uip13-studio-self-hosting.zip` |
| `UIP14` | DONE | 6 | UIP13 | First-stage cleanup, regression coverage and measured hardening before privileged surfaces. | `oxs-uip14-platform-hardening.zip` |
| `UIP15` | DONE | 6 | UIP14 | Build the privileged System touch-keyboard visual surface and layout/state model. | `oxs-uip15-system-keyboard.zip` |
| `UIP16` | TODO | 6 | UIP15 | Integrate UI-side text-input/IME/secure-input/physical-keyboard/occlusion contracts. | `oxs-uip16-text-input-ime.zip` |
| `UIP17` | TODO | 6 | UIP16 | Complete cursor roles/themes/scale/hotspot/modality and native ownership integration seams. | `oxs-uip17-system-cursor.zip` |
| `UIP18` | TODO | 6 | UIP17 | Close notification center, quick controls and transient System surfaces. | `oxs-uip18-system-feedback-surfaces.zip` |
| `UIP19` | TODO | 6 | UIP18 | Migrate the production Launcher/application presentation fully onto System UI. | `oxs-uip19-launcher-migration.zip` |
| `UIP20` | TODO | 6 | UIP19 | Migrate workspace/window chrome/system bars fully onto System UI. | `oxs-uip20-workspace-chrome.zip` |
| `UIP21` | TODO | 6 | UIP20 | Certify System UI across direction, space, modality, accessibility and motion axes. | `oxs-uip21-system-certification.zip` |
| `UIP22` | TODO | 6 | UIP21 | Remove legacy APIs/paths and enforce final production/Studio bundle boundaries. | `oxs-uip22-ui-cleanup.zip` |
| `UIP23` | TODO | 6 | UIP22 | Prove self-hosting + privileged-input dependencies and freeze UI Platform V1. | `oxs-uip23-ui-v1-closeout.zip` |

**Total: 24 patches / 144 atomic tasks.**

### 7.1 Pre-UIP13 Component Floor Audit Repair checkpoint

**Status: CLOSED — the component-floor repair and validation convergence checkpoint were consumed before UIP13; UIP13 now revalidates the stable UI gates in its delivery script.**

This is an inter-patch hardening checkpoint, not a new numbered roadmap batch and not an excuse to grow `pnpm quality`. A from-scratch audit after UIP12 found interaction/accessibility/runtime-scope defects that must be repaired before Studio becomes a self-hosting stress consumer.

The checkpoint now includes the second from-scratch runtime/SDK audit and closes these defect classes in place:

- keyboard/pointer press authority, next-click-only cancellation and optional Pointer Capture;
- per-UiRoot overlay coordination, out-of-order nested modal lock/isolation/focus restoration and document-wide event arbitration without shared modal state;
- UiRoot-scoped overlay/drag portals plus scale/translation-aware portal coordinates;
- robust Tabs/Segmented/ToggleGroup/Toolbar roving entry, manual Tabs focus ownership and tab-panel relationships;
- trigger-owned Select focus, repeated-key typeahead and native required/disabled form semantics;
- Editing unmount/session cleanup, delayed-paste race cancellation, secure context-menu copy/cut and per-UiRoot clipboard adapters;
- logical RTL ScrollView coordinates, real start/center/end snap alignment, native wheel chaining and non-stale synthesized-click suppression;
- DnD participation in the shared Gesture Arena plus stationary edge auto-scroll and scoped preview coordinates;
- non-nested trailing actions, real spatial TileGrid arrows and React-owned Disclosure/Accordion state;
- root-scoped Motion shared-bounds, imperative style ownership and stable Toast timing/upsert semantics;
- library-safe CSS scoped under UiRoot, local container-query ownership and shared environment/media/size observation;
- explicit `@ontologyx/ui` canonical SDK and `@ontologyx/ui/advanced` infrastructure surfaces, with the former `@ontologyx/ui/legacy` compatibility surface removed at UIP14 and the public catalog generated only from the canonical root;
- developer/System semantic repairs including heading/landmark ownership, affix descriptions, opt-in live feedback, command filtering/navigation and overridable System copy;
- reconciliation of current daily UI checker assumptions with the post-UIP12/package-subpath ownership model while preserving historical acceptance scripts as evidence.

**Visible acceptance:** `pnpm dev ui` → `?ui-kit=1&view=audit`. The page must demonstrate keyboard press state, invalid-selection tab recovery, required Select validity, sibling trailing actions, scoped/coarse-pointer overlays, grid arrow navigation, normalized progress and runtime-scope repair status.

**Repair record:** `docs/ui-platform/COMPONENT_FLOOR_AUDIT_REPAIR.md` records both independent audits and regression coverage; `docs/ui-platform/PUBLIC_SDK_SURFACE.md` freezes the canonical/advanced/legacy package boundary and host-safe CSS contract.

**Release rule:** do not start UIP13 until stable UI gates pass and this workbench is accepted. Remaining non-blocking visual/product polish stays scheduled for UIP14/UIP21 rather than reopening the component floor opportunistically.

---

# 8. Atomic patch plans

## UIP00 — Platform spine + capability demand map

**ZIP:** `oxs-uip00-platform-spine.zip`

**Purpose:** make the architectural decisions and higher-layer requirements explicit before implementation migration starts.

- `OXUI-001` [DONE / P0] — **Freeze the four-layer architecture.** Canonicalize Foundations → Primitives → Components → System UI ownership, allowed dependency edges, public/internal support rules, and the System→Primitive prohibition.
- `OXUI-002` [DONE / P0] — **Inventory and classify the current UI codebase.** Map every current foundation/adaptive/primitive/component/pattern/motion/scroll/gesture/cursor/editing/drag-drop/preview/style export to keep/move/merge/replace/remove; identify duplicates and mixed generic/system ownership.
- `OXUI-003` [DONE / P0] — **Build the top-down capability demand map.** Inventory current Launcher, Workspace, system surfaces, settings/navigation needs, notification/quick-control needs, touch keyboard host needs, and ordinary developer-app needs; map each required capability to Foundations, Primitives, Components, or System UI before lower-layer APIs are frozen.
- `OXUI-004` [DONE / P0] — **Create/stage the production `@ontologyx/ui` package boundary.** Reusable UI ownership moves out of Shell while preserving behavior; React is not duplicated and package output is tree-shakeable ESM.
- `OXUI-005` [DONE / P0] — **Separate the development-only UI Studio boundary.** Establish/stage `apps/ui-studio` while preserving `pnpm dev ui` and port `5174`; Studio code/dependencies must not enter the production shell graph.
- `OXUI-006` [DONE / P0] — **Machine-enforce dependency ownership.** Add UI-only source checks/fixtures for forbidden deep imports, System→Primitive access, feature→internal access, production→Studio dependencies, and unowned reusable visual implementations.

**Acceptance:** architecture + capability map + source inventory agree; package boundaries typecheck; intentional invalid-import fixtures fail deterministically; no root backend/planning state changes; `pnpm dev ui` visibly presents the UIP00 Platform Spine and the migrated current UI gallery. `READY` becomes `DONE` only after this Studio presentation is accepted.

**Out of scope:** visual redesign, component expansion, backend/runtime work.

## UIP01 — Generated catalog substrate

**ZIP:** `oxs-uip01-catalog-spine-v1-no-rollback.zip`

**Purpose:** ensure everything built after this patch documents and exposes itself automatically.

- `OXUI-007` [DONE / P0] — **Define colocated UI docs metadata.** Add a typed `defineUiDocs(...)`/equivalent schema for layer, category, summary, usage guidance, status, accessibility, RTL, touch, responsive behavior, examples, and optional playground hints without duplicating TypeScript prop declarations.
- `OXUI-008` [DONE / P0] — **Extract public prop metadata from TypeScript.** Use the TypeScript compiler API to derive prop names, types, optionality, JSDoc, deprecation, and safe default metadata with clear failure behavior for unsupported shapes.
- `OXUI-009` [DONE / P0] — **Discover public UI entries from intentional exports.** Generate catalog membership from source/package exports + colocated docs rather than a second manual component registry.
- `OXUI-010` [DONE / P0] — **Generate a deterministic catalog artifact.** Produce normalized generated TS/JSON with `generate` and `--check` modes; stale output must fail UI validation.
- `OXUI-011` [DONE / P0] — **Create lazy, fault-isolated example loading.** Examples live next to their owner, are lazy-loaded, and have page/example error boundaries so one broken lab cannot blank the Studio.
- `OXUI-012` [DONE / P0] — **Keep catalog delivery non-blocking.** Generated docs/catalog tooling remains available for development, while patch application and Studio iteration never depend on an aggregate UI validation gate.

**Acceptance:** adding one public component + colocated docs can feed the generated catalog without a second manual registry; generated navigation, prop metadata, lazy examples, and isolated errors are visibly inspectable in the Studio Catalog view. Automated diagnostics are optional and non-blocking; `READY` becomes `DONE` when the Studio presentation is accepted.

**Out of scope:** final Studio visual polish.

## UIP02 — Foundations + environment contract

**ZIP:** `oxs-uip02-foundations-environment.zip`

**Purpose:** freeze every cross-cutting environment contract before visual layers are rebuilt.

- `OXUI-013` [DONE / P0] — **Normalize semantic design tokens.** Reconcile color, typography, spacing, sizing, shape, material, elevation, z-order, interaction, motion, scroll, safe-area, and component sizing namespaces; remove feature-named/duplicate aliases.
- `OXUI-014` [DONE / P0] — **Make static CSS + custom properties canonical.** Separate structural CSS from semantic theme variables; prohibit a required CSS-in-JS runtime and uncontrolled global styling.
- `OXUI-015` [DONE / P0] — **Create typed `UiRoot` environment/scoped theming.** Support light/dark/system/custom themes, nested semantic overrides, density, reduced-motion preference, and environment propagation without global mutation.
- `OXUI-016` [DONE / P0] — **Freeze logical direction and bidi semantics.** Support `auto | ltr | rtl`, start/end APIs, logical CSS by default, semantic directional icon mirroring, and an allowlist for genuine physical geometry.
- `OXUI-017` [DONE / P0] — **Freeze adaptive/container/safe-area semantics.** Define container-first constraints, dynamic viewport handling, safe areas, future occlusion/insets, and separation of available space from density/device naming.
- `OXUI-018` [DONE / P0] — **Freeze modality, touch-target and accessibility state vocabulary.** Define fine/coarse pointer, touch/pen/mouse/keyboard modality, minimum usable target policy, focus-visible semantics, forced-colors expectations, and common states such as disabled/read-only/selected/checked/busy/invalid.

**Acceptance:** test scopes can switch theme, direction, density, modality, safe-area values, and reduced-motion independently at runtime; representative foundation fixtures pass LTR/RTL and narrow/wide checks without component-specific hacks.

**Out of scope:** component-specific interaction implementation.

## UIP03 — Shared interaction kernel

**ZIP:** `oxs-uip03-interaction-kernel.zip`

**Purpose:** build the shared behavioral kernel once so Components do not invent local pointer/focus/overlay engines.

- `OXUI-019` [DONE / P0] — **Normalize press/activation behavior.** Unify touch, pen, mouse and keyboard activation, pressed/cancelled/disabled state, pointer capture, and visual press hooks under one reusable contract.
- `OXUI-020` [DONE / P0] — **Normalize focus and keyboard navigation.** Centralize focus-visible policy, focus restoration, tab semantics, roving/arrow conventions, RTL-aware directional behavior, and hidden-state tab isolation.
- `OXUI-021` [DONE / P0] — **Create one gesture arbitration model.** Tap, long-press, pan, swipe, edge-pan, drag-start and scroll compete through one arena so multiple owners cannot accidentally trigger from one touch stream.
- `OXUI-022` [DONE / P0] — **Reconcile motion infrastructure.** Preserve high-refresh/time-based springs, interruption, reduced motion, shared-bounds capability and performance probes behind a smaller component-facing API.
- `OXUI-023` [DONE / P0] — **Create one layer/overlay lifecycle manager.** Centralize portal/layer ordering, modal/nonmodal ownership, outside interaction, Escape, focus trap/restoration, nested overlays, scroll locking, and safe-area placement.
- `OXUI-024` [DONE / P0] — **Create one floating geometry service.** Share anchor/placement/collision/flip/shift logic, logical-direction placement and resize/scroll observation; evaluate an external focused library only if Servo compatibility, correctness and bundle measurements beat the in-house path.

**Acceptance:** focused test fixtures prove pointer/touch/keyboard parity, RTL-aware navigation, nested overlay correctness, no floating update loops, reduced-motion behavior, and one-owner gesture arbitration.

## UIP04 — Specialized runtime services

**ZIP:** `oxs-uip04-runtime-services.zip`

**Purpose:** reconcile the specialized reusable engines that higher Components depend on before those Components are migrated.

- `OXUI-025` [DONE / P0] — **Reconcile scroll infrastructure.** Keep native scroll ownership, inertia/bounce/snap/nesting/indicators and high-refresh behavior while normalizing directionality, touch arbitration, keyboard access, container adaptation and reduced motion.
- `OXUI-026` [DONE / P0] — **Reconcile editable-text infrastructure.** Normalize value/selection/composition/edit-session hooks so fields can use one backend-neutral visual contract with a clean future native text/IME bridge.
- `OXUI-027` [DONE / P0] — **Reconcile drag/drop infrastructure.** Provide reusable drag source/drop target/reorder/autoscroll services with touch continuation, keyboard/accessibility semantics and RTL-safe geometry without leaking backend data-transfer ownership.
- `OXUI-028` [DONE / P0] — **Reconcile cursor/pointer semantics.** Define semantic cursor roles, visibility/modality behavior and component declarations through one service; feature-local CSS cursor ownership remains forbidden.
- `OXUI-029` [DONE / P0] — **Normalize environment observation without resize loops.** Provide the narrow container/geometry/media observation utilities required by higher layers and ban repeated ad-hoc `ResizeObserver`/measurement state machines.
- `OXUI-030` [DONE / P0] — **Close runtime-service integration tests.** Exercise scroll + gestures + overlays + drag + editing + cursor together under touch/mouse/keyboard, RTL, resize, density and reduced-motion transitions.

**Acceptance:** one canonical implementation exists for each reusable runtime service and architecture checks reject feature/component duplicate engines.

## UIP05 — Primitive layer

**ZIP:** `oxs-uip05-primitives.zip`

**Purpose:** build the complete minimal Primitive vocabulary once on top of frozen Foundations/runtime contracts.

- `OXUI-031` [DONE / P0] — **Freeze the Primitive semantic ceiling and allowlist.** Primitives may express structure/layout/type/material/icon behavior but no product/system semantics; classify which current primitive-like exports stay, merge, move up, or disappear.
- `OXUI-032` [DONE / P0] — **Close structural layout Primitives.** Productionize `Box`/equivalent, `Stack`, `Row`, `Grid`, `Wrap`, `Container`, `Inset`, `SafeArea`, and `Spacer` with logical direction, typed gaps/alignment, container-safe sizing and minimal DOM.
- `OXUI-033` [DONE / P0] — **Close typography Primitives.** Productionize `Text`, `Heading`, `Label` and monospace/code treatment with semantic elements, wrap/truncate/selectable policy, bidi behavior and foundation typography tokens.
- `OXUI-034` [DONE / P0] — **Close surface/separator Primitives.** Productionize `Surface`, `Divider` and basic layering hooks without embedding card/dialog/system semantics; material/elevation/theme behavior remains token-driven.
- `OXUI-035` [DONE / P0] — **Close the Icon Primitive.** One lightweight SVG/icon registry path owns size/stroke/current-color, decorative/action accessibility, semantic bidi mirroring and safe custom-icon extension.
- `OXUI-036` [DONE / P0] — **Close Primitive docs/tests/escape-hatch policy.** Every Primitive gets generated docs + examples + theme/RTL/container checks; arbitrary class/style passthrough is narrowed so Primitives cannot become an ungoverned CSS backdoor.

**Acceptance:** Components can be implemented without product semantics or duplicate layout engines; every Primitive is documented and passes its complete cross-cutting matrix in this patch.

## UIP06 — Components: actions + selection

**ZIP:** `oxs-uip06-actions-selection.zip`

**Purpose:** close the common interactive control floor used by forms, navigation, overlays and System UI.

- `OXUI-037` [DONE / P0] — **Close `Button` API.** Normalize size, tone, variant, leading/trailing icon, loading, disabled, full-width/adaptive behavior, touch target, keyboard/focus and RTL placement.
- `OXUI-038` [DONE / P0] — **Close `IconButton` + toggle-action behavior.** One API family covers plain icon actions and selected/toggle states with semantic labeling, hit-target policy, tooltip integration hooks and touch-first behavior.
- `OXUI-039` [DONE / P0] — **Add/close `Checkbox` and `Radio` families.** Support controlled/uncontrolled state, groups, indeterminate where applicable, keyboard navigation, accessible naming and RTL/touch behavior.
- `OXUI-040` [DONE / P0] — **Add/close `Switch`.** Normalize checked/disabled/read-only behavior, label composition, drag/tap interaction, RTL geometry and touch target without private gesture logic.
- `OXUI-041` [DONE / P0] — **Add/close `Slider` and range/value semantics.** Use shared gesture/focus infrastructure, orientation/logical direction, keyboard steps, touch hit area, marks/labels where justified and accessible value semantics.
- `OXUI-042` [DONE / P0] — **Add/close segmented/toggle grouping.** Provide typed mutually-exclusive/multi-toggle grouping needed by higher layouts without feature-local tab-like CSS; close docs/state matrices for the whole patch.

**Acceptance:** all action/selection controls are generated in Studio and pass theme × RTL × container × touch/mouse/keyboard × state coverage before the patch closes.

## UIP07 — Components: fields + forms

**ZIP:** `oxs-uip07-fields-forms.zip`

**Purpose:** build one coherent developer-facing text/form vocabulary on the shared editing and overlay services.

- `OXUI-043` [DONE / P0] — **Close the shared field frame/form-control contract.** Standardize label, description, error, required/optional, disabled/read-only, prefix/suffix, helper/action regions and accessible relationships so input components do not duplicate chrome.
- `OXUI-044` [DONE / P0] — **Close `TextField`.** Use the shared editable-text service for value/selection/composition, clear/actions, validation states, secure-compatible structure, RTL/bidi text and touch/keyboard semantics.
- `OXUI-045` [DONE / P0] — **Close `SearchField`.** Build on the same field contract with search/clear semantics, adaptive width, optional suggestions trigger seam, bidi text behavior and System/developer reuse.
- `OXUI-046` [DONE / P0] — **Add/close multiline text input.** Provide `TextArea`/multiline capability with resize/scroll policy, composition/selection, character/line guidance where justified and mobile/touch-safe editing behavior.
- `OXUI-047` [DONE / P0] — **Add/close choice/select field.** Build Select/Combobox-like responsibility only to the capability demand map, using the shared floating/overlay/list services rather than a new popup implementation.
- `OXUI-048` [DONE / P0] — **Close form grouping and field acceptance.** Provide generic field groups/sections only where needed; validate error/busy/read-only/disabled, keyboard, touch, RTL, narrow container and generated docs across all field Components.

**Acceptance:** ordinary developer forms can be built without feature-owned field chrome, popup engines or accessibility wiring.

## UIP08 — Components: data + navigation

**ZIP:** `oxs-uip08-data-navigation.zip`

**Purpose:** provide reusable collection/navigation building blocks before System layouts are attempted.

- `OXUI-049` [DONE / P0] — **Close `ListItem`/action-row responsibility.** Support leading/trailing regions, primary/secondary text, metadata, selection/activation, swipe/context seams where justified, density, touch and bidi behavior.
- `OXUI-050` [DONE / P0] — **Close section/list collection composition.** Provide generic list/section/group structures, empty/loading separators and scroll integration without embedding product data ownership or premature virtualization complexity.
- `OXUI-051` [DONE / P0] — **Close `Tabs` and tab-list semantics.** Roving keyboard focus, selected state, indicator motion, overflow/scroll behavior, RTL ordering and touch targets use shared services.
- `OXUI-052` [DONE / P0] — **Add adaptive navigation components.** Provide generic navigation bar/rail/drawer responsibility driven by available space and capability demand, without OXS-specific launcher/workspace semantics.
- `OXUI-053` [DONE / P0] — **Close toolbar/app-bar/action grouping.** Provide generic toolbar/top-app-bar/action-group/overflow composition used by developer apps and later System UI, with touch-first overflow and responsive collapse.
- `OXUI-054` [DONE / P0] — **Close status/feedback indicators used in data/navigation.** Normalize `Badge`, status indicator, progress/spinner and skeleton/loading affordances with accessible semantics, reduced motion and lightweight output.

**Acceptance:** common app navigation/data surfaces can be composed entirely from Components with no System-specific ownership and full cross-cutting coverage.

## UIP09 — Components: overlays + feedback

**ZIP:** `oxs-uip09-overlays-feedback.zip`

**Purpose:** put every transient UI family on the already-frozen overlay/floating/gesture services.

- `OXUI-055` [DONE / P0] — **Close `Dialog`/`AlertDialog`.** Modal lifecycle, focus trap/restoration, Escape/outside policy, destructive/confirm semantics, responsive sizing, touch actions and RTL are shared rather than local.
- `OXUI-056` [DONE / P0] — **Close `Sheet`/`BottomSheet`.** Generic sheet behavior uses the gesture arena, safe areas/occlusion, adaptive placement and shared overlay lifecycle without OXS-specific layout assumptions.
- `OXUI-057` [DONE / P0] — **Close `Popover`.** Anchoring, logical placement, collision handling, focus/dismissal, nested behavior and resize/scroll updates use the shared floating service.
- `OXUI-058` [DONE / P0] — **Close `Menu`/`ContextMenu`.** Menu item semantics, keyboard/roving focus, submenus where demanded, right-click/long-press invocation, touch sizing and RTL placement share one implementation family.
- `OXUI-059` [DONE / P0] — **Close `Tooltip`.** Accessible delayed hover/focus enhancement never becomes an essential-action requirement; touch behavior is explicit and overlay lifecycle is shared.
- `OXUI-060` [DONE / P0] — **Add transient feedback host/components.** Toast/Snackbar/Banner responsibility uses live-region semantics, timeout/pause rules, actions, reduced motion, safe-area placement and generated docs; notification-center product semantics remain outside Components.

**Acceptance:** every overlay uses the same lifecycle/floating/gesture infrastructure and no component contains a second portal/focus/placement engine.

## UIP10 — Components: developer compositions

**ZIP:** `oxs-uip10-developer-compositions.zip`

**Purpose:** close the reusable mid-level SDK that System UI will consume instead of reaching down into Primitives.

- `OXUI-061` [DONE / P0] — **Close generic content containers.** Add only capability-demanded `Card`/panel/disclosure/accordion-like compositions that materially reduce repeated Primitive assembly while remaining product-neutral.
- `OXUI-062` [DONE / P0] — **Expose `ScrollView` as a developer Component.** Present a stable public API over the shared scroll service with direction, keyboard, snap/indicator, nested-scroll and touch behavior already normalized.
- `OXUI-063` [DONE / P0] — **Create generic page/scaffold composition.** Provide developer-level content/header/footer/sidebar/inset slots that solve ordinary application structure without embedding OXS system-surface semantics.
- `OXUI-064` [DONE / P0] — **Create reusable grid/tile/application-item compositions.** Lift current `AppTile`-like generic responsibility into developer Components where justified, separating reusable tile behavior from Launcher-specific state/layout.
- `OXUI-065` [DONE / P0] — **Create generic empty/error/loading state compositions.** Standardize illustration/icon, title/body/actions/status structure with responsive/touch/accessibility behavior and no product copy ownership.
- `OXUI-066` [DONE / P0] — **Freeze the Component-layer public surface for System consumption.** Compare the completed Component SDK to the `UIP00` capability demand map, close any predeclared generic gaps now, and record the System-support API that higher layers may consume without Primitive access.

**Acceptance:** the `UIP00` System/developer capability demand map is satisfied at the reusable layer before System UI implementation begins; no known generic gap is deferred upward.

## UIP11 — System UI boundary + migration floor

**ZIP:** `oxs-uip11-system-boundary.zip`

**Purpose:** establish OXS-specific ownership only after the reusable Component floor is complete.

- `OXUI-067` [DONE / P0] — **Create the `system/` namespace and ownership policy.** Define OXS-specific composition naming, exports, system-only helpers and the line between reusable Component behavior and product/System state.
- `OXUI-068` [DONE / P0] — **Create the System scaffold/slot contract.** Define desktop/system content regions, transient layers, safe-area/inset propagation, focus/interaction boundaries and adaptive slots using Component APIs only.
- `OXUI-069` [DONE / P0] — **Classify/migrate current Launcher pattern ownership.** Move Launcher-specific composition/state layout into System UI while consuming public Components for search, tiles/lists, controls and overlays; zero direct Primitive imports survive.
- `OXUI-070` [DONE / P0] — **Classify/migrate current Desktop Workspace pattern ownership.** Move workspace-specific visual composition to System UI while preserving window-scene/product boundaries and consuming approved Component APIs only.
- `OXUI-071` [DONE / P0] — **Define System surface/inset classes.** Standardize system bars, modal/nonmodal overlays, privileged surfaces and content occlusion semantics as System compositions over Components.
- `OXUI-072` [DONE / P0] — **Prove System→Component-only ownership.** Static fixtures/source checks fail any System import of Primitives or primitive-level internals; missing generic capability must fail the patch rather than trigger a local System workaround.

**Acceptance:** current System patterns compile/render through the System layer with zero direct Primitive imports and zero feature-owned reusable visual implementations.

## UIP12 — System layout library

**ZIP:** `oxs-uip12-system-layouts-v1-stable-gates.zip`

**Purpose:** build the OXS shell layout vocabulary on the frozen Component layer without reopening lower architecture.

- `OXUI-073` [DONE / P0] — **Close `DesktopShellLayout` / SystemScaffold.** Model desktop content, system chrome slots, transient overlays, safe areas and runtime resize behavior through Components + System helpers only.
- `OXUI-074` [DONE / P0] — **Close Launcher/application-browsing layouts.** Adaptive launcher shell, search/header, app grid/list and action regions work from narrow touch containers through ultrawide desktop using completed Components.
- `OXUI-075` [DONE / P0] — **Close system bar/dock/panel layouts.** Responsive horizontal/vertical system chrome, grouped status/actions, overflow and touch hit regions stay backend-neutral.
- `OXUI-076` [DONE / P0] — **Close settings/system-navigation layouts.** Single-column, split-view and adaptive settings scaffolds use Component navigation/list/form APIs with first-class RTL and touch navigation.
- `OXUI-077` [DONE / P0] — **Close notification + quick-settings layouts.** Compose Component lists/toggles/sliders/sheets/feedback into OXS-specific notification and quick-control structures without implementing backend delivery/data semantics.
- `OXUI-078` [DONE / P0] — **Close privileged/transient System layouts.** Provide UI-only OSD, command surface, lock/auth shell regions and virtual-keyboard host/occlusion compositions where required, explicitly excluding authentication/IME/backend implementation.

**Acceptance:** all principal OXS shell screen/layout families exist as System compositions, pass theme/RTL/container/touch fixtures, and consume only Components/System helpers.

## UIP13 — Studio self-hosting + generated workbench

**ZIP:** `oxs-uip13-studio-self-hosting.zip`

**Purpose:** make the Studio a strict self-hosting consumer of `@ontologyx/ui` while completing the generated catalog/playground environment. Minimal Vite/React bootstrap may remain outside the UI Kit; reusable visible chrome may not.

- `OXUI-079` [DONE / P0] — **Generate Studio navigation/menu from catalog data using `@ontologyx/ui`.** Layers/categories/status/order come from source metadata; no hand-maintained component menu or parallel navigation controls remain.
- `OXUI-080` [DONE / P0] — **Dogfood `@ontologyx/ui` for Studio chrome.** Navigation, search, tabs, lists, panels, forms, overlays, feedback, layout/compositions and reusable interactions all consume public UI Kit APIs; raw reusable controls/CSS are removed from Studio.
- `OXUI-081` [DONE / P0] — **Generate rich detail/prop pages.** Render guidance, import/API info, prop tables, types/defaults/JSDoc/deprecation, accessibility/RTL/touch/responsive notes and examples from the generated catalog.
- `OXUI-082` [DONE / P0] — **Create live playground + canonical state matrices.** Auto-generate safe controls for simple prop types, allow explicit custom controls for complex props, and show applicable rest/hover/pressed/focus/disabled/loading/selected/error states.
- `OXUI-083` [DONE / P0] — **Create the global environment toolbar.** Switch theme/custom theme, LTR/RTL, density, reduced motion, fine/coarse pointer/touch simulation, viewport/container presets and safe-area/occlusion values without changing examples.
- `OXUI-084` [DONE / P0] — **Add search, stable deep links and coverage UX.** Search components/props/docs, route directly to pages/examples/states, surface missing coverage, and preserve fault isolation so one broken example cannot blank Studio.

**Acceptance:** adding a documented public Component automatically creates a searchable, navigable, deep-linkable Studio page with props/examples and no manual menu/page registration; all reusable visible Studio chrome is rendered through public `@ontologyx/ui`, leaving only minimal app/bootstrap/dev-tool code outside the kit.

## UIP14 — First-stage cleanup + measured hardening

**ZIP:** `oxs-uip14-platform-hardening.zip`

**Purpose:** remove already-replaced dual paths and establish regression/accessibility/bundle budgets before privileged System surfaces are added. This is explicitly not V1 closeout.

- `OXUI-085` [DONE / P0] — **Enforce final public coverage matrices.** Every public interactive Component/System export declares and satisfies applicable theme, RTL, responsive/container, touch, mouse, keyboard/focus, reduced-motion and state coverage; exceptions require explicit rationale.
- `OXUI-086` [DONE / P0] — **Add deterministic visual/layout regression coverage.** Capture representative generated Studio fixtures across canonical sizes/directions/themes/states with focused snapshots that avoid meaningless churn.
- `OXUI-087` [DONE / P0] — **Strengthen automated accessibility validation.** Add semantic/accessibility assertions and, if a focused dev-only audit library passes compatibility/cost evaluation, automated rules without replacing manual keyboard/touch review.
- `OXUI-088` [DONE / P0] — **Set and enforce production JS/CSS/runtime budgets.** Record tree-shaking probes, package/CSS size, dependency cost, duplicate React checks, render/update performance probes and Studio-exclusion checks; regressions require explicit reviewed budget changes.
- `OXUI-089` [DONE / P0] — **Remove already-migrated parallel UI paths and compatibility adapters.** Delete Component-era pattern/preview/style duplication and temporary bridges whose consumers are already migrated; System feature adapters still required by UIP15..UIP20 are removed only in UIP22.
- `OXUI-090` [DONE / P0] — **Freeze the pre-privileged-surface checkpoint.** Reconcile docs/source boundaries, public API policy, generated catalog, Studio self-hosting status and measured budgets before UIP15; do not claim UI Platform V1 closeout here.

**Acceptance:** one production `@ontologyx/ui` package + one self-hosting dev-only Studio remain; completed lower-layer compatibility paths are removed; measured quality/bundle gates pass; explicit remaining System/input work is carried forward to UIP15..UIP23 rather than mislabeled as debt.

---

## UIP15 — Privileged System touch keyboard surface ✅

**ZIP:** `oxs-uip15-system-keyboard.zip`

**Purpose:** build the on-screen keyboard as a privileged OXS System UI surface composed from public Components, never as an application/React feature widget with independent lifecycle ownership.

- `OXUI-091` [DONE / P0] — **Freeze the privileged keyboard surface contract.** Define compositor-owned visibility/focus lifecycle inputs, System-surface identity, layout/language/secure-mode state and the rule that application code cannot mount the system keyboard directly.
- `OXUI-092` [DONE / P0] — **Build the keyboard layout/key model.** Support character, modifier, action, navigation, symbol, numeric and language-switch keys with stable identifiers, labels and layout groups independent of visual geometry.
- `OXUI-093` [DONE / P0] — **Build key interaction and modifier state.** Reuse shared press/long-press behavior for repeat, alternate characters, Shift/Caps/symbol latch states and cancellation without creating a keyboard-private gesture engine.
- `OXUI-094` [DONE / P0] — **Close adaptive/RTL/touch geometry.** Keyboard rows/grids adapt to available width, orientation, safe areas and logical direction while keeping reliable hit targets and no hover dependency.
- `OXUI-095` [DONE / P0] — **Close secure and content-purpose visual modes.** Password/secure, numeric, email, URL/search and ordinary text sessions expose only allowed visual affordances; suggestion/learning surfaces are absent or suppressed where policy forbids them.
- `OXUI-096` [DONE / P0] — **Add Studio + UI-level keyboard acceptance.** Exercise language/layout changes, modifiers, alternates, secure mode, RTL, narrow/wide and coarse-pointer behavior using the same System/Component implementation production will consume.

**Acceptance:** CLOSED. The keyboard exists as a privileged OXS System surface built from public Components, ordinary product feature code is statically forbidden from owning it, and the typed command/session contract is ready for UIP16 native text-input/IME/physical-keyboard integration.

## UIP16 — Text input + IME + secure input + occlusion integration

**ZIP:** `oxs-uip16-text-input-ime.zip`

**Purpose:** connect the completed field/editing and privileged keyboard UI contracts to the native compositor/text-input lifecycle without moving protocol authority into React.

- `OXUI-097` [TODO / P0] — **Freeze the focused text-input session bridge.** Carry content purpose/hints, secure state, surrounding text, selection, editable bounds and session identity from the focused Component to native ownership through a bounded typed contract.
- `OXUI-098` [TODO / P0] — **Close IME composition flow.** Support preedit, commit, delete-surrounding-text, selection updates and composition cancellation without breaking controlled Components or React editing state.
- `OXUI-099` [TODO / P0] — **Close virtual-keyboard command injection.** Key actions/modifiers/repeat/alternate output travel through a backend-neutral command boundary; the System keyboard never mutates DOM input state as an ad-hoc shortcut.
- `OXUI-100` [TODO / P0] — **Implement physical-keyboard-aware auto-show policy.** Text focus shows the System keyboard only when policy says no usable physical keyboard is present; attach/detach transitions update visibility without stealing or dropping text focus.
- `OXUI-101` [TODO / P0] — **Enforce secure-input boundaries end to end.** Secure sessions suppress prohibited clipboard/suggestion/learning/inspection behavior and avoid leaking surrounding text across UI/native boundaries.
- `OXUI-102` [TODO / P0] — **Close keyboard occlusion/insets integration.** Keyboard geometry updates SystemScaffold/content insets and restores them on hide/resize/output changes; runtime-sensitive acceptance must prove focus and hit alignment rather than relying on static checks.

**Acceptance:** focused fields, IME and the privileged keyboard participate in one compositor-owned input lifecycle; physical-keyboard policy and occlusion work in runtime acceptance. Native/backend work required for this acceptance remains cross-owner implementation, not React authority.

## UIP17 — System cursor completion

**ZIP:** `oxs-uip17-system-cursor.zip`

**Purpose:** finish the first-class cursor subsystem across UI declarations and native/compositor ownership.

- `OXUI-103` [TODO / P0] — **Close the semantic cursor-role vocabulary.** Default/pointer/text/select/grab/grabbing/resize/drag-drop/not-allowed/busy/progress and other accepted roles map through one public declaration path.
- `OXUI-104` [TODO / P0] — **Close theme/scale/hotspot contracts.** Cursor theme, nominal size, output scale and hotspot metadata are explicit and remain correct across per-output/fractional-scale transitions.
- `OXUI-105` [TODO / P0] — **Close modality visibility policy.** Touch can hide the pointer, mouse/pen movement restores it as appropriate, keyboard focus never requires a visible cursor, and visibility ownership is centralized.
- `OXUI-106` [TODO / P0] — **Integrate drag/drop/resize/text/busy cursor state.** Shared interaction/runtime state selects semantic roles without feature-local cursor CSS or independent pointer state machines.
- `OXUI-107` [TODO / P0] — **Close native/compositor cursor ownership.** UI roles cross a typed boundary to the system cursor owner; hotspot/scale/output changes do not create duplicated visual cursors.
- `OXUI-108` [TODO / P0] — **Prove cursor geometry across resize/scale transitions.** Runtime acceptance covers pointer/hover/hit alignment, including the known nested fractional-scale/high-DPI debt before final closeout.

**Acceptance:** one system cursor owner serves all UI/System surfaces with semantic roles, theme/scale/hotspot correctness and proven pointer alignment.

## UIP18 — Notifications + transient System surfaces

**ZIP:** `oxs-uip18-system-feedback-surfaces.zip`

**Purpose:** build OXS-specific notification, quick-control and OSD composition from the completed Component overlay/feedback layer.

- `OXUI-109` [TODO / P0] — **Create Notification Center composition.** Group/list/card/action/dismiss structures remain System-owned while reusable list/card/button semantics come from Components.
- `OXUI-110` [TODO / P0] — **Create Quick Settings composition.** Toggles, sliders, segmented controls and actions compose into adaptive OXS-specific control surfaces without duplicating control logic.
- `OXUI-111` [TODO / P0] — **Create OSD/transient status surfaces.** Volume/brightness/progress/status presentations share System surface/layer/inset rules and Component feedback semantics.
- `OXUI-112` [TODO / P0] — **Close notification action/dismiss interaction.** Touch, mouse and keyboard actions use shared Component semantics; swipe/reveal behavior goes through the common gesture arena.
- `OXUI-113` [TODO / P0] — **Close adaptive/safe-area/RTL behavior.** Notification and quick surfaces work as panels/sheets according to available space without device-name branching.
- `OXUI-114` [TODO / P0] — **Add System feedback integration tests/Studio presentation.** Exercise grouped notifications, quick controls, OSD and nested transient overlays with topmost focus/dismiss behavior.

**Acceptance:** principal feedback/control System surfaces are OXS-specific compositions over Components with no duplicate overlay/control engines.

## UIP19 — Launcher/application presentation migration

**ZIP:** `oxs-uip19-launcher-migration.zip`

**Purpose:** finish the production Launcher beyond the UIP11 ownership wrapper and remove transitional launcher paths.

- `OXUI-115` [TODO / P0] — **Close production Launcher structure.** Search/header/application collection/content-state/action regions use SystemLauncher + Components across compact through ultrawide layouts.
- `OXUI-116` [TODO / P0] — **Close application item/runtime states.** Running/pending/unavailable/attention/selected metadata map into reusable ApplicationItem/status Components without feature-owned visual controls.
- `OXUI-117` [TODO / P0] — **Close Launcher search and keyboard navigation.** Filtering, focus return, traversal and activation are deterministic in LTR/RTL and remain usable without pointer input.
- `OXUI-118` [TODO / P0] — **Close touch reveal/dismiss behavior.** Edge/reveal and sheet interaction use the shared Component/gesture stack with runtime acceptance for cancel/settle/resize behavior.
- `OXUI-119` [TODO / P0] — **Integrate Launcher with keyboard/insets/cursor.** Text focus, System keyboard visibility, occlusion and pointer roles remain aligned while Launcher is open.
- `OXUI-120` [TODO / P0] — **Certify Launcher migration without transitional-path regression.** Shell consumes the final public System API; UIP14 already removed ApplicationLauncherPattern/AppTile bridges, so this task proves they have not re-entered production while closing the full Launcher runtime flow.

**Acceptance:** production Launcher is fully System-owned, Component-only below that boundary, and the old mixed Pattern path is gone.

## UIP20 — Workspace/window chrome migration

**ZIP:** `oxs-uip20-workspace-chrome.zip`

**Purpose:** finish desktop/workspace/System chrome composition on the same System→Component-only architecture.

- `OXUI-121` [TODO / P0] — **Close production workspace scaffold.** Background/work-area/window-scene slots, reserved edges and System overlays use SystemScaffold contracts without React taking compositor window authority.
- `OXUI-122` [TODO / P0] — **Close window chrome Components/System composition.** Title/action/resize/focus/attention presentation uses reusable Components plus System-specific placement/state.
- `OXUI-123` [TODO / P0] — **Close system bar/dock production composition.** Status/actions/application groups, overflow, safe areas and adaptive orientation use approved Components.
- `OXUI-124` [TODO / P0] — **Close workspace focus/selection visual states.** Active/inactive/attention/drag/resize state stays synchronized with compositor authority and accessible System presentation.
- `OXUI-125` [TODO / P0] — **Integrate cursor/touch/input behavior with chrome.** Resize/grab/drop roles and touch hit regions use centralized interaction/cursor ownership across scale/resize transitions.
- `OXUI-126` [TODO / P0] — **Certify workspace migration without transitional-path regression.** Shell imports final System workspace/chrome APIs only; UIP14 already removed DesktopWorkspacePattern, so this task proves it has not re-entered while remaining feature-owned reusable chrome is eliminated.

**Acceptance:** workspace/window/system chrome is compositionally owned by System UI while compositor/WM state authority remains native; no System→Primitive/runtime bypass exists.

## UIP21 — Cross-axis System certification

**ZIP:** `oxs-uip21-system-certification.zip`

**Purpose:** certify the completed System surface family across the environment axes that were mandatory from UIP00 rather than retrofit them feature by feature.

- `OXUI-127` [TODO / P0] — **Certify LTR/RTL and bidi System behavior.** Launcher, bars, settings, notifications, keyboard and workspace chrome use logical direction while physical-edge semantics remain explicitly documented.
- `OXUI-128` [TODO / P0] — **Certify adaptive/container/output behavior.** Narrow/wide/ultrawide, nested, orientation, safe-area and runtime resize transitions preserve usable layout without device-name branches.
- `OXUI-129` [TODO / P0] — **Certify touch/pen/mouse modality behavior.** Target sizes, gesture competition, hover enhancement, pointer visibility and direct manipulation are consistent across System surfaces.
- `OXUI-130` [TODO / P0] — **Certify keyboard/focus/accessibility behavior.** Roving focus, traps/restoration, accessible names/states/live regions and non-pointer operation cover all principal System flows.
- `OXUI-131` [TODO / P0] — **Certify reduced-motion/forced-colors/theme behavior.** Motion policy, high contrast and semantic theming apply across System surfaces without feature-specific forks.
- `OXUI-132` [TODO / P0] — **Record runtime-sensitive evidence.** Pointer/keyboard/IME/occlusion/overlay flows that cannot be proven statically require real runtime acceptance before they may be marked DONE.

**Acceptance:** every principal System surface has explicit cross-axis evidence and runtime-sensitive flows are not closed by shape/static checks alone.

## UIP22 — Legacy/API/bundle cleanup

**ZIP:** `oxs-uip22-ui-cleanup.zip`

**Purpose:** delete transitional architecture only after the final consumers have migrated, then freeze the production/UI-Studio boundary and package budgets.

- `OXUI-133` [TODO / P0] — **Delete legacy Pattern and deep-import surfaces.** Remove compatibility wrappers, obsolete styles/docs and old exports after zero-consumer proof.
- `OXUI-134` [TODO / P0] — **Freeze the intentional public API surface.** Remove accidental exports/internal runtime leakage, mark true compatibility aliases with lifecycle policy and record versioning expectations.
- `OXUI-135` [TODO / P0] — **Complete Studio parallel-UI deletion.** No reusable raw button/input/select/textarea/navigation/panel/overlay/feedback implementation remains in Studio outside minimal bootstrap/dev tooling.
- `OXUI-136` [TODO / P0] — **Reconcile generated docs/catalog after cleanup.** No deprecated entry or moved owner leaves stale catalog metadata, duplicate docs or manual navigation state.
- `OXUI-137` [TODO / P0] — **Enforce final JS/CSS/dependency budgets.** Measure tree-shaking, production CSS, runtime dependency cost, duplicate React risk and prove Studio-only code/dependencies are excluded.
- `OXUI-138` [TODO / P0] — **Run final architecture drift audit.** Prove System→Components, Shell→public System/Components, Studio→public `@ontologyx/ui`, centralized runtime ownership and logical CSS across the actual workspace.

**Acceptance:** only intentional production APIs/owners remain; Studio is a pure consumer; bundle/dependency budgets are recorded and no dual UI architecture survives.

## UIP23 — UI Platform V1 closeout

**ZIP:** `oxs-uip23-ui-v1-closeout.zip`

**Purpose:** close V1 only after the UI Platform can build itself, System surfaces consume it, and privileged input/cursor dependencies have real acceptance.

- `OXUI-139` [TODO / P0] — **Prove Studio self-hosting end to end.** All reusable visible Studio UI comes from the same production `@ontologyx/ui` public surface it documents; bootstrap-only exceptions are enumerated.
- `OXUI-140` [TODO / P0] — **Prove System→Component-only end state.** Launcher/workspace/bars/settings/notifications/keyboard/System overlays contain no Primitive/runtime/legacy Pattern bypass.
- `OXUI-141` [TODO / P0] — **Close touch-keyboard/text-input dependencies.** Physical-keyboard-aware auto-show, IME composition, secure input and occlusion have runtime evidence; unresolved native work blocks V1 UI closeout rather than becoming hidden debt.
- `OXUI-142` [TODO / P0] — **Close cursor/pointer dependencies.** Cursor role/theme/scale/hotspot and pointer hit alignment pass required nested/output resize/scale acceptance; the fixed-scale development workaround cannot be treated as final architecture.
- `OXUI-143` [TODO / P0] — **Run final generated/visual/accessibility/performance suite.** Catalog, Studio state matrices, deterministic layouts, accessibility assertions and measured production budgets all pass on the final public surface.
- `OXUI-144` [TODO / P0] — **Freeze UI Platform V1.** Reconcile architecture/docs/task ledger/public API, remove completed temporary debt and record only explicitly accepted post-V1 work with owners and rationale.

**Acceptance:** OntologyX UI Platform V1 is self-hosting, System-owned above Components, includes the privileged touch-keyboard/input and cursor requirements with real runtime acceptance, and has no hidden parallel UI implementation.

---

# 9. Definition of done for every public visual item

A public visual item is complete only when the applicable subset below is closed **in the same patch that creates/migrates it**:

- intentional public API and typecheck;
- generated catalog presence and fresh generated output;
- description, usage guidance, prop documentation and at least one isolated example;
- theme + custom-theme behavior;
- LTR + RTL behavior;
- narrow + wide + nested-container behavior;
- touch/coarse-pointer operation;
- mouse/fine-pointer operation;
- keyboard/focus operation;
- accessible naming/state semantics;
- full applicable state vocabulary;
- reduced-motion behavior where animated;
- forced-colors behavior where applicable;
- no forbidden layer import;
- no new duplicate motion/scroll/gesture/floating/editing/cursor engine;
- measured bundle/runtime impact when nontrivial.

There is intentionally **no later “make everything RTL/responsive/touch accessible” patch**.

# 10. Patch delivery protocol

Every delivery from this roadmap must use its stable patch ID.

Example:

```text
UIP06
ZIP: oxs-uip06-actions-selection.zip
Tasks: OXUI-037..OXUI-042
```

Each patch delivery must include:

1. exact task IDs closed;
2. changed ownership/files;
3. migrations/deletions performed;
4. UI-only automated checks run;
5. Studio runtime/human checks required where visual/interactive;
6. any intentionally deferred item, which remains TODO rather than being silently accepted;
7. a rebase-tolerant apply package that preserves unrelated local edits. While the focused UI track is active, UI patch apply scripts **must not automatically roll back applied source changes when validation fails**; leave the workspace in place for incremental repair and revalidation. Merge/apply conflicts must still fail safely rather than overwrite unrelated local work.

Do not run or mutate root OXS planning/evidence merely to deliver this standalone UI track.

# 11. Explicit non-goals

This roadmap does not transfer backend/compositor authority into React merely because UI work depends on those systems. UIP16/UIP17/UIP23 may require cross-owner native/runtime changes and real acceptance, but the native side remains authoritative. Examples of responsibilities that cannot be claimed complete from UI representation alone:

- clipboard/data-transfer backend ownership;
- native IME/text-input protocol lifecycle;
- physical keyboard detection/device authority;
- virtual-keyboard/native input command backend;
- DRM/KMS/hardware certification;
- Wayland protocol completion;
- notification delivery backend;
- authentication backend;
- application launch/backend lifecycle changes.

The UI contracts should be ready for those systems later without absorbing their responsibilities now.
