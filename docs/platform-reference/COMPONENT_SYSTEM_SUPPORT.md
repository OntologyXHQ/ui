# OXS UI Platform — Component System-support Surface

Status: **UIP10 readiness checkpoint**. This document freezes the generic public Component floor that System UI may consume beginning with UIP11. A missing generic capability must be added here first; System UI may not bypass this surface through Primitives, Patterns, or shared runtime internals.

## 1. Actions and selection

System UI may compose:

- `Button`, `ToggleButton`, `IconButton`;
- `Checkbox`, `Radio`, `RadioGroup`, `Switch`, `Slider`, `SegmentedControl`, `ToggleGroup`.

These own shared press/selection semantics, minimum target policy, keyboard/focus behavior and state exposure.

## 2. Fields and forms

System UI may compose:

- `TextField`, `SearchField`, `TextArea`, `Select`;
- `FieldGroup`, `FieldSection`.

Editing/clipboard/IME-ready behavior remains behind these public Components and their shared runtime contracts.

## 3. Data and navigation

System UI may compose:

- `List`, `ListItem`, `ListSection`, `ListSeparator`;
- `Tabs`, `AdaptiveNavigation`, `Toolbar`, `ActionGroup`, `AppBar`;
- `Badge`, `StatusIndicator`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`.

Settings rows are satisfied by `ListItem` + `ListSection`; notification-card structure is satisfied by `Card` + list/feedback Components rather than a notification-specific generic API.

## 4. Overlays and transient feedback

System UI may compose:

- `Dialog`, `AlertDialog`, `Sheet`, `BottomSheet`;
- `Popover`, `Menu`, `MenuItem`, `MenuSeparator`, `ContextMenu`, `Tooltip`;
- `Snackbar`, `ToastHost`, `Banner`, `useToastQueue`.

Overlay lifecycle/focus/floating/gesture ownership remains behind these Components. Notification-center product semantics are not part of the generic Component layer.

## 5. Developer compositions frozen by UIP10

System UI may compose:

- `Card`, `Disclosure`, `Accordion` for reusable grouped content;
- `ScrollView`, `ScrollSnapItem` as the public facade over the shared scroll runtime;
- `PageScaffold` for ordinary header/sidebar/content/footer application structure;
- `TileGrid`, `Tile`, `ApplicationItem` for generic grid/tile/application identity presentation;
- `ContentState` for empty/error/loading replacement state composition.

`AppTile` was removed at UIP14 after `ApplicationItem` became the canonical reusable application/tile Component and current Shell/System consumers no longer required the wrapper.

## 6. Capability-map reconciliation

The UIP00 demand map is satisfied at the reusable layer as follows:

| Higher-layer demand | Approved generic Component support |
|---|---|
| Launcher search | `SearchField` |
| Launcher app collection | `TileGrid` + `ApplicationItem` + `List` |
| Launcher loading/empty/error | `ContentState`, `Progress`, `Spinner`, `Skeleton` |
| Settings rows/sections | `ListItem`, `ListSection`, `FieldSection` |
| Settings one/two-pane structure | `PageScaffold` + `AdaptiveNavigation` |
| System bar actions/status | `Toolbar`, `ActionGroup`, `IconButton`, `Badge`, `StatusIndicator` |
| Notification cards/lists | `Card`, `List`, feedback Components |
| Quick controls | selection Components + overlays |
| Touch-keyboard generic key surfaces | `Button`/`ToggleButton` + `TileGrid`/layout Components |
| Transient OSD/status surfaces | overlay + feedback Components |
| Scroll/nested scroll | `ScrollView` facade |

## 7. Explicitly not generic

The following remain System UI responsibilities and must not be added to Components merely to simplify UIP11/UIP12:

- OXS workspace/background/work-area composition;
- Launcher open/close/search policy and application launch state;
- system bars/docks and reserved-edge attachment semantics;
- OXS Settings navigation/state ownership;
- notification-center and quick-settings product structures;
- OSD/product copy/policy;
- privileged keyboard host/occlusion semantics.

## 8. UIP11 entry rule

UIP11 may begin only from this dependency direction:

```text
Foundations + shared runtime internals
                ↓
            Primitives
                ↓
            Components
                ↓
             System UI
```

System UI imports Components only. If a System implementation needs a lower-layer capability directly, that is evidence of a missing Component contract and must be resolved at the Component boundary before proceeding.


## 9. Studio self-hosting consumer rule

The dev-only Studio is also a first-class consumer of this public Component floor. As components exist, Studio chrome must use them rather than create a parallel reusable control system. See `STUDIO_SELF_HOSTING.md`; UIP13 completes this migration and UIP23 proves it.

## 10. Privileged input surfaces

The public Component floor is intentionally sufficient to render a System touch keyboard and input surfaces, but protocol/device authority does not move into Components. UIP15 builds the privileged System keyboard from Components and is complete; UIP16 integrates the UI editing/session boundary with compositor/native text-input, IME, secure-input, physical-keyboard policy and occlusion. Cursor ownership is completed in UIP17. See `SYSTEM_INPUT_SURFACES.md`.
