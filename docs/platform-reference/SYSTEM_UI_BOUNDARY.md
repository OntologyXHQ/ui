# OntologyX UI Platform — System UI boundary

Status: **canonical from UIP11**.

## Ownership

System UI is the OXS-specific composition layer above the reusable Component SDK.

```text
Foundations + shared runtime internals
                ↓
            Primitives
                ↓
            Components
                ↓
             System UI
                ↓
               Shell
```

System code may import public Components and System-local helpers. It may not import Primitives, legacy Patterns, gesture/motion/scroll/editing/drag-drop/cursor internals, or Studio code.

If a System surface needs a generic capability that is missing from Components, the Component layer is repaired first. System-local primitive workarounds are architecture defects.

## Public System surface

UIP11 established the boundary with `SystemScaffold`, `SystemSurface`, `SystemLauncher` and `SystemWorkspace`. UIP12 adds the canonical layout vocabulary: `DesktopShellLayout`, `SystemApplicationBrowser`, `SystemBar`, `SystemDock`, `SystemPanel`, `SystemSettingsLayout`, `SystemNotificationCenter`, `SystemQuickSettings`, `SystemOsd`, `SystemCommandSurface`, `SystemLockLayout` and `SystemKeyboardHost`.

See `SYSTEM_LAYOUT_LIBRARY.md` for layout responsibilities and explicit backend non-ownership.

UIP14 removed the completed `ApplicationLauncherPattern` and `DesktopWorkspacePattern` compatibility exports. System UI owns the canonical `SystemLauncher` and `SystemWorkspace` surfaces; old Pattern names are no longer public package paths.

## Native authority does not move into React

System UI composes visuals and interactions from the UI Platform. It does not become authoritative for:

- Wayland/compositor/window lifecycle;
- application process lifecycle;
- input protocol/session ownership;
- physical-device detection;
- notification delivery;
- hardware/output state.

Those owners feed typed state/commands across explicit boundaries.

## Privileged surfaces

`SystemScaffold` includes a privileged surface host so the touch keyboard and other privileged System surfaces have an explicit ownership slot. UIR15 executable evidence mounts the canonical keyboard through that slot. This does not make privileged surfaces ordinary application widgets or move native authority into React. See `SYSTEM_INPUT_SURFACES.md`.

## Studio

The Studio demonstrates this System boundary but is itself only a dev consumer. It must progressively dogfood public `@ontologyx/ui`; see `STUDIO_SELF_HOSTING.md`.
