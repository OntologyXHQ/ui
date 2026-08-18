# OntologyX UI Platform — UIP00 Source Inventory

This inventory records the source state at the start of the focused UI Platform track and the intended ownership/disposition. It is a migration map, not a claim that every current API already satisfies the final layer contracts.

## 1. Summary

Current reusable UI is moved from `apps/shell/src/ui-kit` to `packages/ui/src` in UIP00 without redesigning behavior. Preview-only code is moved to `apps/ui-studio`.

Disposition vocabulary:

- **KEEP** — responsibility already belongs in the target platform.
- **MOVE** — ownership changes now, behavior remains.
- **RECONCILE** — keep behavior now; final API/ownership is frozen by a later planned patch.
- **SPLIT** — current file mixes generic and OXS-specific responsibility and must be separated before System UI closeout.
- **REMOVE** — compatibility/duplicate path has no final owner.

## 2. Foundations and environment

| Current area | UIP00 disposition | Final responsibility | Planned freeze |
|---|---|---|---|
| `foundations/` | MOVE + RECONCILE | Foundations | UIP02 |
| `adaptive/UiRoot.tsx` | MOVE + RECONCILE | Foundations/environment root | UIP02 |
| `styles/tokens.css` | MOVE + RECONCILE | Foundations tokens | UIP02 |
| `styles/base.css` | MOVE + RECONCILE | Foundations/global platform baseline | UIP02 |

## 3. Primitives

| Current source | Disposition | Final responsibility | Planned freeze |
|---|---|---|---|
| `primitives/Icon.tsx` | MOVE + RECONCILE | Primitive iconography | UIP05 |
| `primitives/Layout.tsx` | MOVE + RECONCILE | Primitive layout/spacing | UIP05 |
| `primitives/Surface.tsx` | MOVE + RECONCILE | Primitive material/surface | UIP05 |
| `primitives/Typography.tsx` | MOVE + RECONCILE | Primitive type | UIP05 |
| `styles/primitives.css` | MOVE + RECONCILE | Primitive styling | UIP05 |

## 4. Developer-facing controls

| Current source | Disposition | Final responsibility | Planned freeze |
|---|---|---|---|
| `components/Button.tsx` | MOVE + RECONCILE | Components/actions | UIP06 |
| `components/IconButton.tsx` | MOVE + RECONCILE | Components/actions | UIP06 |
| `components/TextField.tsx` | MOVE + RECONCILE | Components/fields | UIP07 |
| `components/Scrim.tsx` | MOVE + RECONCILE | Component overlay support | UIP09 |
| `components/AppTile.tsx` | REMOVED UIP14 | canonical owner is `ApplicationItem` | UIP10/UIP14 |
| `styles/components.css` | MOVE + RECONCILE | Component styling | UIP06..UIP10 |

## 5. Generic overlay/pattern code

| Current source | Disposition | Final responsibility | Planned freeze |
|---|---|---|---|
| `patterns/Sheet.tsx` | MOVE + RECONCILE | Components/overlay | UIP09 |
| `patterns/Popover.tsx` | MOVE + RECONCILE | Components/overlay | UIP09 |
| `patterns/Menu.tsx` | MOVE + RECONCILE | Components/overlay/navigation | UIP09 |
| `patterns/ContextMenu.tsx` | MOVE + RECONCILE | Components/overlay | UIP09 |
| `patterns/Tooltip.tsx` | MOVE + RECONCILE | Components/feedback | UIP09 |
| `patterns/floating.ts` | MOVE + RECONCILE | shared overlay positioning support | UIP03 |
| `patterns/layer.ts` | MOVE + RECONCILE | shared overlay/focus support | UIP03 |
| `patterns/config.ts` | MOVE + RECONCILE | shared overlay policy | UIP03/UIP09 |
| `styles/system-ui.css` | SYSTEM OWNER | OXS-specific System scaffold/launcher/workspace styling | UIP11 |

## 6. Current OXS-specific compositions

| Current source | Disposition | Final responsibility | Planned freeze |
|---|---|---|---|
| `patterns/ApplicationLauncherPattern.tsx` | REMOVED UIP14 | canonical owner is `system/SystemLauncher.tsx` | UIP11/UIP14 |
| `patterns/DesktopWorkspacePattern.tsx` | REMOVED UIP14 | canonical owner is `system/SystemWorkspace.tsx` | UIP11/UIP14 |
| `patterns/GestureRevealHandle.tsx` | MIGRATED / DEEP-COMPAT WRAPPER | public owner is `components/GestureRevealHandle.tsx` | UIP11/UIP22 |
| `styles/patterns.css` | LEGACY/GENERIC RESIDUE | no Launcher/Workspace System styling remains | UIP11/UIP22 |

## 7. Shared interaction/runtime services

| Current area | Disposition | Final responsibility | Planned freeze |
|---|---|---|---|
| `motion/` | MOVE + RECONCILE | shared interaction kernel | UIP03 |
| `gestures/` | MOVE + RECONCILE | shared interaction kernel | UIP03 |
| `scroll/` | MOVE + RECONCILE | specialized runtime service | UIP04 |
| `cursor/` | MOVE + RECONCILE | specialized runtime service | UIP04 |
| `editing/` | MOVE + RECONCILE | specialized runtime service | UIP04 |
| `drag-drop/` | MOVE + RECONCILE | specialized runtime service | UIP04 |
| `styles/motion.css` | MOVE + RECONCILE | runtime-owned styling | UIP03 |
| `styles/scroll.css` | MOVE + RECONCILE | runtime-owned styling | UIP04 |
| `styles/cursor.css` | MOVE + RECONCILE | preview/runtime semantic cursor styling | UIP04 |

## 8. Tests

All tests that verify reusable UI behavior move with the production owner into `packages/ui/src/**/__tests__`. Shell-specific tests remain in Shell. The existing UI test setup is copied to the package so UI behavior no longer depends on Shell ownership.

## 9. Preview/Studio

| Current source | UIP00 disposition | Final responsibility |
|---|---|---|
| `preview/UiKitGallery.tsx` | MOVE | `apps/ui-studio` current-surface page |
| `preview/MotionLab.tsx` | MOVE | Studio-only lab |
| `preview/ScrollLab.tsx` | MOVE | Studio-only lab |
| `preview/CursorLab.tsx` | MOVE | Studio-only lab |
| `preview/SystemUiPatternsLab.tsx` | MOVE | Studio-only lab |
| `preview/ui-kit-gallery.css` | MOVE | Studio-only styling |

Studio code is intentionally absent from the `@ontologyx/ui` public export graph.

## 10. Shell consumers

The following current Shell consumers are migrated from relative UI ownership to the public package:

- `apps/shell/src/app/ShellApp.tsx`
- `apps/shell/src/app/nativeShellBridge.ts` (public UI types only)
- `apps/shell/src/features/launcher/AppLauncher.tsx`
- `apps/shell/src/features/workspace/Workspace.tsx`

The production `main.tsx` no longer imports or conditionally mounts the Studio/gallery.

## 11. Duplicate/mixed ownership risks identified

1. UIP09 removed generic overlay ownership from `patterns/`; UIP11 moves Launcher/Workspace implementation into `system/`. Remaining Pattern files are compatibility or generic migration residue only.
2. `AppTile` mixed generic tile responsibility with launcher-era naming/state; UIP10 moved reusable ownership to `ApplicationItem` + `TileGrid`, and UIP14 removed the completed compatibility wrapper.
3. UIP11 completes System style ownership: Launcher/Workspace/System scaffold styles live in `styles/system-ui.css`; `styles/patterns.css` no longer owns those surfaces.
4. `adaptive/`, `foundations/`, and runtime providers overlap in environment responsibility and are deliberately reconciled before Primitive expansion.
5. current preview navigation is hand-maintained and is replaced by the generated catalog substrate in UIP01.

These are planned migrations, not reasons to redesign APIs during UIP00.

## 12. UIP00 public export snapshot

This is the explicit public surface moved behind `@ontologyx/ui` before later reconciliation patches. It prevents an export from disappearing silently during the ownership migration.

### Adaptive/environment

`UiRoot`, `UiRootProps`.

### Foundations

`UiDensity`, `UiTheme`, `SpaceToken`, `RadiusToken`, `ElevationToken`, `MaterialToken`.

### Primitives

`Icon`, `IconName`, `IconProps`, `IconSize`; `Container`, `Grid`, `Inset`, `Row`, `SafeArea`, `Spacer`, `Stack`, `Align`, `Justify`, `LayoutGap`; `Surface`, `SurfaceProps`; `Heading`, `HeadingProps`, `Label`, `LabelProps`, `Text`, `TextProps`.

### Current controls/components

`Button`, `ButtonProps`, `ButtonVariant`, `ControlSize`; `IconButton`, `IconButtonProps`; `Scrim`, `ScrimProps`, `ScrimTone`; `SearchField`, `SearchFieldProps`, `TextField`, `TextFieldProps`.

### Cursor service

`CursorRegion`, `CursorRegionProps`, `CursorRoleAttributes`, `cursorRoleAttributes`, `useCursorRole`; `CursorRuntimeProvider`, `CursorRuntimeSnapshot`, `useCursorRuntime`; `CursorAnimationPreference`, `CursorRole`, `CursorRuntimeConfig`, `PointerModality`, `SystemCursorRole`, `DEFAULT_CURSOR_RUNTIME_CONFIG`, `normalizeCursorRole`, `SYSTEM_CURSOR_ROLES`.

### Drag/drop service

`autoScrollDelta`, `DragDropProvider`, `useDragDropRuntime`; `DragItem`, `DragOperation`, `DragPoint`, `DragPreview`, `DragSession`, `DropTargetContract`, `cursorRoleForDragOperation`, `DRAG_OPERATIONS`; `DragSourceOptions`, `useDragSource`, `useDropTarget`.

### Editing service

`configureUiClipboardAdapter`, `hasUiClipboardTransport`, `readUiClipboardText`, `UiClipboardAdapter`, `writeUiClipboardText`; `EditableContentPurpose`, `EditableSelection`, `EditableTextState`, `EDITABLE_CONTENT_PURPOSES`; `EditableTextContractOptions`, `inputModeForContentPurpose`, `useEditableTextContract`.

### Gesture service

`GestureCandidate`, `GestureArena`, `gestureArena`; `GestureAxis`, `GesturePhase`, `GesturePoint`, `GesturePriority`, `GestureVector`, `PanGestureSample`, `SwipeDirection`, `SwipeGestureResult`; `useDragReveal`; `EdgePanGestureOptions`, `ScreenEdge`, `useEdgePanGesture`; `PanGestureOptions`, `usePanGesture`; `PressGestureOptions`, `usePressGesture`; `SwipeGestureOptions`, `classifySwipe`, `useSwipeGesture`.

### Motion service

`FrameRateTarget`, `MotionFrame`, `MotionFrameListener`, `MotionClock`; `FramePerformanceListener`, `FramePerformanceSnapshot`, `FramePerformanceMonitor`; `MotionPreference`, `MotionRuntime`, `MotionRuntimeProviderProps`, `MotionRuntimeProvider`, `useFramePerformanceSnapshot`, `useMotionRuntime`, `useReactCommitProbe`, `useReducedMotion`; `SharedBounds`, `SharedBoundsProps`; `SpringPreset`, `SpringSpec`, `SpringState`, `readSpringSpec`, `SpringValue`, `stepSpring`; `MotionTransitionProps`, `TransitionAliasProps`, `TransitionKind`, `CollapseTransition`, `FadeTransition`, `MotionTransition`, `ReplaceTransition`, `RevealTransition`, `ScaleTransition`, `SlideTransition`; `MotionProgress`, `InteractiveSettleOptions`, `InteractiveTransitionListener`, `InteractiveTransitionOptions`, `InteractiveTransitionPhase`, `InteractiveTransitionSnapshot`, `InteractiveTransitionController`, `resolveInteractiveSettleTarget`, `useInteractiveTransition`.

### Current patterns/compositions

`ContextMenuAction`, `ContextMenuProps`, `ContextMenu`; `FloatingPlacement`; `GestureRevealHandle`; `MenuItemProps`, `MenuProps`, `Menu`, `MenuItem`, `MenuSeparator`; `PopoverProps`, `Popover`; `BottomSheetProps`, `SheetPlacement`, `SheetProps`, `BottomSheet`, `Sheet`; `TooltipProps`, `Tooltip`.

### Scroll service

`ScrollAxis`, `ScrollIndicatorMode`, `ScrollPhysicsConfig`, `ScrollSnapMode`; `applyEdgeResistance`, `computeIndicatorMetrics`, `consumeScrollDelta`, `DEFAULT_SCROLL_PHYSICS`, `decayScrollVelocity`, `nearestSnapOffset`, `normalizeWheelDelta`, `readScrollBounceSpec`, `readScrollPhysicsConfig`; `ScrollSnapItemProps`, `ScrollViewHandle`, `ScrollViewProps`, `ScrollSnapItem`, `ScrollView`.

### System UI

`SystemScaffold`, `SystemSurface`, `SystemLauncher`, `SystemWorkspace`, `SystemLauncherItem`, `SystemLauncherProps`, and `filterSystemLauncherItems` are the public System boundary. UIP14 removed the completed `ApplicationLauncherPattern` and `DesktopWorkspacePattern` compatibility paths.
