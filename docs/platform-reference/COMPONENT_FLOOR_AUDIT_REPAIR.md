# OntologyX UI Platform — Pre-UIP13 Component Floor Audit Repair

Status: repair implementation prepared; visible acceptance remains required in UI Studio before UIP13 starts.

## Why this checkpoint exists

After UIP12, the production layer direction was correct, but a from-scratch review of every public Primitive/Component/System composition found interaction, accessibility and runtime-scope defects that ordinary source-boundary checks could not detect. Studio self-hosting would amplify those defects, so UIP13 is intentionally blocked until this checkpoint passes the stable UI gates and the repair workbench is inspected.

This checkpoint does **not** create a new architecture layer, new numbered roadmap patch, or patch-specific `pnpm quality` rules. It repairs the already-frozen Component floor in place.

## Root causes repaired

### Press and activation

- Button keyboard press state now participates in the shared press lifecycle while native button keyboard activation remains authoritative.
- Cancelled pointer/gesture ownership suppresses the browser's later synthesized click instead of activating a control after the Gesture Arena rejected the press.
- Pointer Capture remains an optional host capability.
- ToggleButton/IconButton state changes now respect consumer `preventDefault()` vetoes.

### Focus and overlays

- Shared focus discovery includes textarea/native select/contenteditable and falls back to the focusable surface when no child target exists.
- Dialog, Sheet, Popover, Tooltip and Select floating content portal into the owning `UiRoot`, not `document.body`.
- Modal sibling isolation understands the scoped portal root, preserving proper inert/aria-hidden behavior after portal migration.
- Tooltip touch-hover remains suppressed, but keyboard-focus tooltips are no longer hidden merely because the host has a coarse pointer.
- Dialog/Popover/Sheet public contracts require an accessible naming path.
- Menu supports typeahead; ContextMenu uses the shared press-cancellation lifecycle; BottomSheet normalizes invalid drag distances.

### Selection/navigation/form semantics

- Tabs, SegmentedControl and ToggleGroup always preserve one enabled roving Tab entry even when controlled state is invalid or points at a disabled option.
- Tabs expose a tab-to-panel ID/`aria-controls` seam.
- Toolbar now owns a real one-Tab-stop roving focus contract.
- Select adds typeahead and a visually-hidden native select proxy for required/disabled form semantics while retaining OXS floating-list interaction.
- Checkbox reasserts indeterminate DOM state after native activation.
- Switch uses a real visible label target and composes caller pointer handlers with the shared pan gesture.
- Slider normalizes reversed ranges, invalid step values and out-of-range marks.
- Progress normalizes invalid/nonpositive maxima instead of producing NaN/invalid native progress state.

### Composition semantics

- Actionable ListItem and Tile main actions no longer wrap trailing interactive controls; trailing actions are siblings, preventing button-inside-button DOM.
- Tile selection is visual/component state rather than incorrectly claiming toggle-button `aria-pressed` semantics.
- TileGrid can expose one Tab entry with logical arrow-key navigation for application-style collections.
- AppBar has configurable semantic heading level; Heading now supports levels 1–6.
- Field prefix/suffix content participates in the field's accessible description relationship.
- Spacer's decorative accessibility invariant can no longer be overridden accidentally.
- SystemWorkspace no longer creates a nested `<main>` when application/PageScaffold content owns the document main landmark.

### Runtime/root ownership

- Motion shared-bounds storage is per MotionRuntime instead of module-global and stale unmatched bounds expire.
- Drag previews portal into the owning UiRoot, preserving direction/theme/token scope.
- Toast timers no longer restart merely because the host rerenders with a new callback identity.
- Duplicate live-region ownership was reduced for toast/loading compositions.
- GestureRevealHandle retains generic interaction in Components while OXS-specific placement/copy belongs to System/Shell.

### Adaptive and System composition consistency

- Production Component coarse/fine-pointer behavior follows UiRoot environment attributes instead of raw pointer/hover media queries, allowing deterministic Studio simulation.
- applicable responsive component rules use container queries instead of viewport-only breakpoints.
- SystemApplicationBrowser owns generic query filtering and keyboard grid behavior instead of requiring Launcher-only filtering logic.
- System labels/placeholders that were hard-coded in public compositions now expose override seams for future localization without API breakage.

## Daily checker reconciliation

Current UI checker scripts now describe the post-UIP12 ownership model instead of stale UIP00/UIP01/legacy-Pattern assumptions. Historical B15/B18 acceptance scripts remain unchanged because they are evidence of their historical acceptance boundary, not the current daily UI architecture contract.

`pnpm quality` intentionally receives no patch-specific rules.

## Regression coverage added

Direct tests cover the repaired root causes, including:

- keyboard press state and cancelled-click suppression;
- Pointer Capture present/absent hosts;
- textarea/native-select focus trapping and surface fallback;
- invalid/disabled roving selection entry;
- Select required/disabled native semantics and typeahead;
- sibling trailing actions;
- UiRoot-scoped modal/tooltip and drag preview portals;
- coarse-pointer keyboard tooltip behavior;
- TileGrid keyboard navigation;
- per-runtime Motion shared-bounds isolation;
- stable Toast duration across rerenders;
- invalid progress normalization.

The polished manual workbench is available at:

```text
pnpm dev ui
http://localhost:5174/?ui-kit=1&view=audit
```

## What remains intentionally later

This checkpoint repairs correctness defects discovered in the existing public floor. It does not steal work from later roadmap batches:

- full generated cross-axis visual/state matrices and deterministic visual regression remain UIP14/UIP21 work;
- a real localization resource/catalog mechanism is later product/platform work; current public System copy is made overridable now to avoid lock-in;
- the privileged touch keyboard is still UIP15, and native text-input/IME/secure-input/physical-keyboard/occlusion integration remains UIP16;
- final legacy compatibility removal and API/bundle cleanup remain UIP22.

UIP13 may begin only after stable gates pass and the audit workbench is visibly accepted.

---

## Second from-scratch audit — Runtime + SDK Boundary Repair v2

A second independent audit of snapshot `OXS-snapshot-20260818-142321.zip` intentionally ignored the first repair's assumptions and traced public controls down into their shared runtimes, CSS host contract and generated catalog. It found deeper multi-root/runtime defects that static layer checks correctly did not attempt to certify. UIP13 remains blocked until this second repair passes the stable gates and the same `view=audit` workbench is accepted.

### Overlay coordination is root-scoped, event arbitration is document-scoped

- each `UiRoot` owns an `OverlayCoordinator`; modal entries, depth, inert isolation and scroll lock are no longer a module-global overlay stack;
- closing a lower nested modal out of order recomputes lock/isolation from the remaining entries instead of restoring stale snapshots;
- focus restoration only occurs for the document-wide top overlay and never restores into an inert/disconnected target behind another modal;
- Escape/outside-press arbitration uses a deliberately tiny document-wide order token so two independent `UiRoot` previews do not both dismiss from one event;
- overlay depth is monotonic inside each root, so removing a middle entry cannot make a later overlay reuse a still-live z-depth;
- Dialog outside press has one owner; the Scrim no longer double-fires dismissal.

### Editing and clipboard lifecycle is scoped and race-safe

- an active editing session ends when the focused field or its runtime provider unmounts, not only on blur;
- beginning a new session ends the previous session before publishing the replacement;
- delayed clipboard paste responses are generation/value/selection guarded and cannot mutate stale field state after focus, input, composition or selection changes;
- clipboard adapters can be supplied per `UiRoot`; the process-level configured adapter remains only a compatibility fallback;
- secure fields block copy/cut from native context-menu events as well as keyboard shortcuts.

### Scroll is logical, chainable and host-capability-safe

- horizontal state is normalized to logical inline position before drag, keyboard, momentum, indicator and snap calculations, covering negative/positive RTL `scrollLeft` models;
- start/center/end `ScrollSnapItem` alignment now affects the actual snap target rather than serving as metadata-only API;
- Pointer Capture is optional and guarded;
- direct-manipulation click suppression lasts only for the browser's immediate synthesized click, not an arbitrary later click;
- wheel events at an owned edge can chain into a native scrollable ancestor instead of trapping the page;
- horizontal direction resolution honours the actual UiRoot/subtree direction.

### Drag/drop joins the Gesture Arena

- pointer drag-start is a real Gesture Arena candidate rather than a private window-owned gesture engine;
- touch movement before long-press abandons DnD so Scroll/Pan can claim the same pointer stream;
- pointer continuation uses source ownership/capture while arena ownership remains authoritative;
- edge auto-scroll is animation-frame driven and continues while the pointer is stationary near an edge;
- drag preview coordinates are converted into the owning UiRoot portal plane and drop-target announcements can use caller-facing labels.

### SDK host safety and public surface

- production UI CSS no longer claims `html`, `body`, `#root` or `:root`; tokens/defaults are scoped under `.ui-root`;
- Shell and Studio own their optional document/app reset styles explicitly;
- `@ontologyx/ui` is the canonical developer-facing visual surface;
- `@ontologyx/ui/advanced` is an explicit infrastructure/diagnostics surface for Studio/platform integration;
- `@ontologyx/ui/legacy` is an explicit temporary compatibility surface and is forbidden for new Studio/product code;
- the generated public catalog is derived from the canonical root surface and excludes runtime providers and legacy Pattern wrappers.

See `PUBLIC_SDK_SURFACE.md` for the package contract.

### Container, portal and shared-observation correctness

- AdaptiveNavigation and related adaptive Components own named local containers rather than accidentally querying the outer UiRoot width;
- floating/drag viewport coordinates are converted into a scale/translation-aware UiRoot portal coordinate plane;
- global modality and media-query listeners are shared per window/query instead of multiplying per UiRoot preview;
- `useObservedElementSize` begins observation after ref assignment during commit and follows a replacement element attached to the same RefObject.

### Public Component behavior repaired in v2

- Select keeps DOM focus on its combobox trigger and uses `aria-activedescendant`, preserving normal Tab continuation despite a portaled listbox;
- repeated single-key Select typeahead cycles matching options rather than building a dead repeated prefix;
- controlled-invalid Tabs align selected fallback with the actual roving entry, while manual activation owns focused and selected values separately;
- `TabPanel` + `tabRelationshipIds` provide deterministic tab/panel relationships;
- Disclosure/Accordion state is React-owned button/region state, avoiding controlled native `<details>` mutation races; single Accordion mode normalizes invalid multi-value input;
- TileGrid uses actual 2D geometry for logical arrow navigation and exposes group semantics rather than claiming an incomplete ARIA grid model;
- SharedBounds/MotionTransition reserve imperative transform/style ownership instead of silently overwriting caller transform styles;
- static StatusIndicator/Spinner output is silent by default and live-region announcement is explicit;
- Toast queue duplicate explicit IDs upsert a single entry and dismiss copy is caller-localizable;
- SystemCommandSurface owns generic query filtering and command focus navigation; non-interactive SystemApplicationBrowser disables both search and item activation.

### Regression expectations added in v2

The test suite now directly targets:

- nested modal out-of-order close and independent UiRoot Escape arbitration;
- one-shot Dialog outside dismissal;
- secure context-menu copy/cut, field-unmount session end, delayed-paste invalidation and per-root clipboard adapters;
- every RTL horizontal scroll model, actual start/center/end snap offsets, missing Pointer Capture and native wheel chaining;
- DnD vs Scroll touch ownership and stationary edge auto-scroll;
- Select Tab continuation/repeated-key typeahead;
- manual Tabs focus/selection separation and tab-panel helper relationships;
- 2D TileGrid movement and controlled Disclosure/Accordion normalization;
- static-vs-announced feedback semantics and duplicate Toast ID upsert;
- SDK root/advanced/legacy export separation, CSS host-safety and portal coordinate conversion;
- initial/ref-swapped element observation;
- System command filtering/focus, non-interactive app browsing and caller-owned settings content labels.

### Acceptance rule

This v2 repair supersedes the earlier statement that only Component-level defects remained. UIP13 may begin only after:

1. catalog generation/discovery passes on the canonical SDK surface;
2. the stable UI quality/type/test/Studio build gates pass;
3. a third independent source audit finds no unresolved P0/P1 runtime or SDK-boundary defect;
4. `?ui-kit=1&view=audit` is visibly accepted.

---

## Third independent source audit — post-repair result

The post-repair target was audited again from the public SDK surface down through Components, Overlay/Focus, Editing/Clipboard, Scroll, Drag/Drop, Motion, CSS/container ownership, generated catalog and current System compositions. This third pass intentionally reviewed the repaired implementation rather than assuming the v2 changes were correct.

### Result

No unresolved P0/P1 defect was found in the runtime/SDK-boundary classes covered by the first two audits. The third pass additionally caught and repaired issues introduced or exposed during v2, including:

- Dialog `restoreFocus` contract wiring;
- strict-null and snap-item typing in the logical ScrollView path;
- AdaptiveNavigation invalid-selection compilation/state alignment;
- consumer event/style composition on Slider/Scroll interaction surfaces;
- portaled Menu/Select Tab continuation and active-descendant ownership;
- multi-pointer Drag/Drop authority and stationary edge auto-scroll coverage;
- initial/ref-swapped observation after commit;
- nested overlay focus lineage and document-wide one-event arbitration across independent UiRoots;
- canonical root/advanced/legacy catalog separation after regeneration.

### Source-level verification performed on the post-repair target

- `scripts/quality-ui-platform.py`: PASS;
- `tools/checks/ui.sh`: PASS, including boundary regression probes and runtime/motion/overlay ownership checks;
- TypeScript transpile sweep across production UI, UI Studio and Shell TS/TSX sources: PASS with no syntax diagnostics;
- generated catalog generation/check/fixture: PASS with 100 canonical public visual entries and no runtime-provider/legacy-pattern leakage;
- host-safety scan: no production `html`/`body`/`#root`/`:root` ownership remains in `@ontologyx/ui`;
- raw Pointer Capture scan: all production direct calls are centralized through the guarded capability helper;
- System lower-layer bypass scan and Component→Pattern scan: clean;
- diff whitespace validation: clean.

These source-level checks do not replace the canonical workspace TypeScript/Vitest/Vite gates. The apply package intentionally runs those gates on the user's real workspace and preserves all edits on failure.

### Pre-UIP13 convergence follow-up — 2026-08-18

Later TypeScript/test-suite follow-ups changed two details after the v2 audit: `GestureRevealHandle` ownership moved from the legacy Pattern facade to the canonical Component, and the UI package test script gained the host-safety preflight. Those changes made two older checker assumptions stale even though the repaired runtime behavior remained intact. A final convergence repair therefore:

- points cursor validation at the canonical Component owner rather than the legacy facade;
- validates the semantic UI test contract (host-safety before Vitest) instead of an obsolete exact script string;
- constrains TileGrid logical-order fallback to genuinely unmeasurable/zero geometry, so a measured spatial edge remains a no-op;
- derives host-safety coverage from every stylesheet imported by the production `styles/index.css`, preventing new production CSS imports from escaping the global-owner scan;
- converges the older two-command CLI validators with the already-canonical `pnpm quality` gate: `dev` and `project` remain the only command families, while `quality` remains the only standalone root architecture gate.

The earlier PASS list records the v2 audit target at that time; it is not a blanket PASS claim for later descendants. The current descendant must re-run its own gates before UIP13 begins.

### UIP13 release decision

The source-audit blocker is cleared. UIP13 remains operationally blocked until the stable workspace gates pass and `?ui-kit=1&view=audit` is visibly accepted.
