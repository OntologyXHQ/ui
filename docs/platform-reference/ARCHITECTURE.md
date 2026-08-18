# OntologyX UI Platform Architecture

Status: canonical for the focused UI Platform track (`UIP00..UIP14`).

## 1. Purpose

OntologyX UI is a platform dependency stack, not a collection of unrelated React components. The platform must let lower layers be stabilized once and then reused upward without feature-local visual or interaction implementations.

Canonical production direction:

```text
Foundations
    ↓
Primitives
    ↓
Components
    ↓
System UI
    ↓
Shell / product consumers
```

Requirements are inventoried top-down once; implementation proceeds bottom-up once.

## 2. Four public responsibilities

### Foundations

Own semantic environment contracts: design tokens, theming/customization, direction/bidi, density, adaptive/container semantics, safe areas/insets, modality, touch-target policy, motion preference, accessibility vocabulary, typography/shape/material/elevation scales.

Foundations should prefer typed contracts, static CSS, and CSS custom properties over runtime style generation.

### Primitives

Own the smallest reusable visual vocabulary: layout, spacing, surfaces, typography, iconography, safe-area structure, and similar structural pieces. Primitives have no OXS product meaning.

### Components

Own the developer-facing UI SDK. Components are the primary API for building applications and the only generic UI dependency System UI should need. They own accessible semantics, state, touch/pen/mouse/keyboard interaction, RTL, adaptive behavior, motion integration, and shared runtime integration.

### System UI

Own OXS-specific composition: workspace, launcher, bars/docks, settings shell, notification/quick-control surfaces, OSD/transient surfaces, and privileged system-surface hosts.

System UI may consume public Components and explicitly System-owned helpers. It may not import Primitives directly. A generic capability missing from Components must be added to Components before System UI consumes it.

## 3. Non-public support code

A layer may own `internal/` support code. Internal code is not a public product API and may not be imported by Shell/features. Support intended for the immediately higher layer must be surfaced through an explicit public contract rather than a deep import.

Runtime engines such as motion, scrolling, gestures, cursor semantics, text editing, drag/drop, floating placement, and observation are shared platform services. `UIP03` and `UIP04` will freeze their final ownership; `UIP00` deliberately preserves their current behavior while moving ownership out of Shell.

## 4. Dependency rules

Allowed:

```text
foundations -> no visual lower layer
primitives  -> foundations
components  -> foundations + primitives + component-owned support
system      -> public components + explicit system-support component contracts
shell       -> public @ontologyx/ui exports
studio      -> public @ontologyx/ui exports (development only)
```

Forbidden:

```text
system      -> primitives
shell       -> @ontologyx/ui deep/internal imports
feature     -> @ontologyx/ui deep/internal imports
production  -> apps/ui-studio
studio      -> production ownership or product runtime dependency
```

## 5. Cross-cutting acceptance is simultaneous

RTL, adaptive/responsive behavior, touch-first interaction, accessibility, theme/customization, state coverage, motion preference, and Studio documentation are not retrofit tracks.

When a public visual API is completed, its applicable matrix closes in the same patch:

```text
theme × direction × container/size × modality × keyboard/focus × state × motion preference
```

## 6. Physical ownership after UIP00

```text
packages/ui/       @ontologyx/ui production owner
apps/ui-studio/    development-only inspection/documentation app
apps/shell/        product consumer
```

The migration in UIP00 moves current reusable UI source out of `apps/shell`. Internal folder naming is intentionally not churned before `UIP02..UIP05` freeze the lower-layer contracts.

## 7. Stable development entry point

```bash
pnpm dev ui
```

opens the standalone Studio on port `5174`. The historical `?ui-kit=1` URL remains harmless/compatible, but the Studio no longer depends on a conditional branch inside the production Shell entrypoint.

## 8. Mandatory Studio presentation gate

Every `UIP00..UIP14` patch ends with a visible Studio presentation of what the patch changed. A patch is not complete merely because source checks, type checks, tests, and builds pass.

The Studio presentation must make the relevant new or changed contract inspectable, including representative states/interactions where applicable. A patch that changes only architecture or ownership must still provide a polished architecture/ownership view in Studio.

## 9. No-backtracking policy

Once a lower-layer public contract is frozen, a later patch consumes it rather than casually redesigning it. If a genuine capability gap is discovered, the change must be explicit, justified against the capability map, backward-compatible where practical, and migrated atomically.
