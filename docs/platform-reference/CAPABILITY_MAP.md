# OntologyX UI Platform — Top-down Capability Demand Map

The demand map is intentionally written before lower-layer APIs are frozen. It describes what higher layers need; it does not prescribe premature component names where the final abstraction is still open.

## 1. Cross-platform developer UI demand

Every ordinary application needs a coherent reusable layer for:

- primary/secondary/destructive actions, icon actions, toggles and selectable actions;
- text/search/password/multiline/numeric and validation-aware fields;
- checkbox/radio/switch/segmented/slider-style selection;
- list, row, item, card, grid, collection and empty-state composition;
- tabs, navigation containers, breadcrumb/section navigation where appropriate;
- progress, spinner, badge, status, inline feedback and transient notification;
- menus, context actions, tooltip/help, popover, dialog, sheet and bottom-sheet presentation;
- toolbar/app-bar/header and generic application scaffold composition;
- scroll containers, keyboard navigation and nested scrolling;
- drag/drop, editable text, focus, cursor, gesture and motion integration.

Primary owner: **Components**, supported by Foundations/Primitives/runtime services.

## 2. Launcher demand

Launcher needs:

- searchable collection presentation;
- application item/tile semantics and pending/selected/unavailable states;
- responsive grid/list behavior;
- keyboard traversal and focus return;
- touch-first open/dismiss/drag behavior;
- sheet/overlay presentation for constrained layouts;
- RTL-safe ordering/alignment and directional interaction;
- loading/empty/error states;
- generic pieces exposed by Components, launcher composition owned by System UI.

## 3. Workspace/Desktop demand

Workspace needs:

- background/work-area scaffold;
- reserved-edge/safe-area awareness;
- window/scene host slots without feature CSS ownership;
- launcher/system-bar attachment points;
- touch/mouse modality-safe hit regions;
- focus/selection visual state surfaces;
- OXS-specific composition owned by System UI.

## 4. System bar / dock demand

System bars/docks need:

- action groups and icon actions;
- application/status item groups;
- selected/running/attention states;
- edge-aware layout and safe areas;
- overflow strategy;
- tooltip/context menu integration;
- touch target expansion without visual inflation;
- horizontal and RTL-safe ordering.

Generic controls belong in Components; bar/dock layout belongs in System UI.

## 5. Settings/navigation demand

Settings needs:

- navigation rail/sidebar/list patterns;
- settings rows with label, description, value/control slots;
- sections and grouped surfaces;
- search;
- forms and validation;
- adaptive one-pane/two-pane transitions based on container space;
- RTL-safe disclosure/directional icons;
- keyboard/touch parity.

Reusable rows/navigation/scaffolds belong in Components. The OXS Settings shell belongs in System UI.

## 6. Notification and quick-control demand

Needs:

- notification card/list primitives at Component level;
- grouped action rows;
- status/badge/progress feedback;
- sliders/toggles/segmented controls;
- dismiss/reveal interaction;
- transient surfaces and sheet/popover presentation;
- responsive stacking and safe-area handling;
- OXS-specific notification center/quick-control composition in System UI.

## 7. Touch keyboard host demand

The eventual privileged keyboard subsystem needs UI support for:

- high-frequency touch actions with stable hit geometry;
- pressed/latched/disabled/alternate states;
- rows/grids that adapt to available width and insets;
- long-press/alternate interaction support;
- secure-input visual policy boundaries;
- occlusion/inset-aware System surface hosting;
- no dependence on hover.

Generic key/control surfaces come from Components and privileged host layout belongs in System UI. UIP15 completes the privileged keyboard visual surface; UIP16 closes the UI/native text-input, IME, secure-input, physical-keyboard visibility and occlusion integration. Native protocol authority remains outside React and runtime-sensitive acceptance is required.

## 8. Transient System UI demand

OSD, volume/brightness, confirmation, task/status and short-lived surfaces need:

- shared overlay/layer/focus/dismiss policy;
- non-modal and modal variants;
- progress/status visualization;
- reduced-motion behavior;
- safe-area collision/clamping;
- touch and keyboard dismissal parity;
- System-specific composition only after generic overlay/feedback Components are complete.

## 9. Mandatory environment axes for every visual API

Applicable public APIs must be designed against these axes at creation time:

### Direction

- `dir=ltr` and `dir=rtl`;
- logical start/end properties;
- directional icon mirroring only where semantically correct;
- bidi-safe text/value composition.

### Container/adaptive space

- narrow nested containers;
- medium layouts;
- wide/ultrawide space;
- no device-name branching;
- safe-area/inset awareness where applicable.

### Modality

- touch first;
- pen;
- mouse/fine pointer;
- keyboard/focus;
- hover never required for access.

### Accessibility

- semantic native/ARIA behavior;
- focus-visible;
- minimum target policy;
- forced colors/high contrast where applicable;
- reduced motion;
- disabled/read-only/loading/error/selected states exposed semantically.

### Theme/customization

- semantic tokens rather than feature colors/sizes;
- scoped theme/customization;
- light/dark/system and future theme extension without component rewrites.

## 10. Dependency readiness checkpoint

UIP10 reconciles the implemented Components SDK against this demand map and records the approved System-support surface in `COMPONENT_SYSTEM_SUPPORT.md`. Missing generic capabilities are closed in Components before System UI is allowed to proceed. System UI may not solve a missing generic requirement through direct Primitive access.

At UIP10 readiness, the generic demands above are covered by the public Component layer. UIP11 begins OXS-specific System ownership; UIP15..UIP20 complete privileged input/system surfaces and product migration. Studio self-hosting is mandatory in UIP13 and proven again at UIP23.
