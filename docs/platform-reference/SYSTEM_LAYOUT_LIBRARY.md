# OntologyX UI Platform — System layout library

Status: **canonical from UIP12**.

UIP12 closes the reusable OXS-specific shell layout vocabulary above the frozen Component floor. These layouts own visual structure only. Native compositor, window-management, notification-delivery, authentication, device and IME/text-input authority remain outside React.

## Desktop shell

`DesktopShellLayout` composes one native workspace scene with logical System chrome slots:

```text
DesktopShellLayout
├── workspace → SystemWorkspace / native scene host
├── topBar   → SystemBar
├── dock     → SystemDock
├── panel    → SystemPanel
├── transient
└── privileged → SystemKeyboardHost / later privileged surfaces
```

All edge names are logical (`block-start`, `block-end`, `inline-start`, `inline-end`). System insets and safe areas are inputs, never inferred from device names.

## Application browsing

`SystemApplicationBrowser` is the shared OXS application-browsing layout used by `SystemLauncher`. Search, application items, grid/list presentation, scrolling and empty states come from public Components. Filtering and application lifecycle policy stay with the caller.

## System chrome

- `SystemBar` — logical top/bottom status/action chrome over `Toolbar`.
- `SystemDock` — block-end or logical side dock over `Toolbar`.
- `SystemPanel` — bounded scrollable side/transient panel over `Card`/`ScrollView`.
- `SystemChromeGroup` — labelled grouping helper for Component-owned status/actions.

These surfaces must not grow private button, gesture, cursor or overflow engines.

## Settings/navigation

`SystemSettingsLayout` composes `AppBar`, `AdaptiveNavigation`, `PageScaffold` and `ScrollView`. Narrow and split-view modes are selected by container space, not desktop/mobile detection. RTL follows the same logical layout path.

## Notifications and quick settings

`SystemNotificationCenter` accepts caller-owned view models, reports activation by stable notification id and renders Component list/content-state semantics. Delivery, permission, persistence, scheduling and action policy are not owned here.

`SystemQuickSettings` accepts System state/actions as public Component controls inside Card sections. Network/audio/display/hardware mutation remains backend-owned.

## Transient and privileged layouts

- `SystemOsd` — informational, pointer-transparent transient status/value surface; lifecycle timing remains caller-owned and placement avoids logical safe area plus external transient occlusion.
- `SystemCommandSurface` — command/search dialog; command discovery/execution remains caller-owned.
- `SystemLockLayout` — UI-only lock/auth shell regions; authentication remains external and content avoids logical safe-area/transient-occlusion inputs.
- `SystemKeyboardHost` — privileged block-end touch keyboard with stable layout/key models, secure/content-purpose presentation and typed command output. UIP16 supplies compositor/text-input/IME/physical-keyboard lifecycle.

`SystemKeyboardHost` was only a reserved slot in UIP12; UIP15 now implements the real visual keyboard surface. Native text-input/IME/physical-keyboard/occlusion authority still remains UIP16.

## Dependency rule

Every file in `packages/ui/src/system` may consume only public Components and System-local helpers. Missing generic behavior is repaired in Components first. The stable `pnpm quality` contract enforces this boundary; UIP12 adds no patch-specific quality rule.
