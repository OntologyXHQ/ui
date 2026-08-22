# UIR14 System UI Core Audit

Status: implementation/evidence repair prepared; planning advances only after the UIR14 closeout passes the canonical UI verify and the real OXS consumer validation.

## Boundary

UIR14 owns the reusable **System UI core** above accepted Components:

- `SystemScaffold`
- `SystemSurface`
- `SystemWorkspace`
- `DesktopShellLayout`
- `SystemApplicationBrowser`
- `SystemLauncher`
- `SystemBar`
- `SystemDock`
- `SystemPanel`
- `SystemChromeGroup`
- `SystemSettingsLayout`

UIR14 does **not** own notification center, quick settings, OSD/command/lock surfaces, or the privileged touch keyboard. Those remain UIR15. Core acceptance evidence must therefore not depend on UIR15 behavior.

The core may use structural HTML for System host/slot classification, but interactive behavior must come from accepted Components. It may not import Primitives, Foundations, interaction engines, host/product code, or UIR15 surfaces directly.

## UI-1401 — Public System UI boundary re-audit

**Closed by this batch.**

The public core inventory above is intentionally System-specific. Generic capability is already available below it:

- application chrome: `AppBar`, `Toolbar`, `StatusIndicator`, `Badge`
- application collections: `ApplicationItem`, `TileGrid`, `List`, `ContentState`
- search: `SearchField`
- overlays: `BottomSheet`
- adaptive application layout: `PageScaffold`, `AdaptiveNavigation`
- bounded content: `Card`, `ScrollView`

No new generic System-owned Button/Input/List/Grid/Overlay primitive is justified. The UIR14 gate rejects raw interactive HTML in core System files and rejects dependencies that bypass Components.

## UI-1402 — Desktop/workspace/scaffold vocabulary

**Closed by this batch.**

`SystemScaffold` / `SystemSurface` remain the System-only structural host vocabulary. `SystemWorkspace` and `DesktopShellLayout` compose accepted Components around a caller-owned native scene slot.

The UIR14 Studio layout evidence now proves:

- caller-owned native scene content remains visible;
- top bar, dock, panel, and chrome grouping are Component-backed;
- logical `inline-start` / `inline-end` placement resolves correctly under RTL;
- the UIR14 scaffold boundary does not mount UIR15 keyboard behavior merely to prove a privileged host slot.

## UI-1403 — Launcher/application-browser ownership

**Closed by this batch.**

Application data remains caller-owned view-model input. The System layer:

- accepts stable `id`/name/icon/description/keywords view models;
- accepts a controlled query;
- performs only the documented deterministic text projection over supplied candidates;
- reports activation by stable id;
- never fetches, persists, ranks from product state, resolves routes, or launches applications itself.

`SystemLauncher` owns only presentation/pending feedback around caller policy. `onLaunch(id)` remains the external authority boundary.

The direct Studio application-browser example keeps its query and activation state outside the reusable System component, and G6 exercises it with keyboard and coarse-pointer input.

## UI-1404 — System bars/docks/settings shell

**Closed by this batch.**

Bars, docks, panels, chrome groups, and settings remain host-neutral compositions:

- caller supplies visible status/actions/section models;
- logical edges are used instead of physical left/right policy;
- settings selection is controlled/observable caller state;
- no router, navigation service, storage, network request, or backend command execution is embedded in the reusable System source.

G6 proves both narrow single-column and wider split settings layouts from container geometry.

## UI-1405 — Zero direct Primitive imports

**Closed by this batch.**

The architecture gate already rejects `system -> primitive` dependencies globally. The dedicated UIR14 gate additionally audits the System core file set and rejects direct imports from Primitives, Foundations, runtime engines, or UIR15 files.

The allowed production dependency shape is:

`System core -> accepted Components` plus reviewed same-layer System composition.

## UI-1406 — Real OXS consumer revalidation

**Required before DONE.**

This batch does not introduce a new public System API. Even so, UIR14 closeout requires a packed `@ontologyx/ui` candidate to be validated against the real OXS repository before planning advances.

The closeout sequence is intentionally explicit:

1. regenerate/check catalog;
2. run the dedicated UIR14 gate;
3. run canonical `pnpm verify`;
4. build the packed UI tarball;
5. run `pnpm v1:oxs:check -- <OXS root>` using the isolated Git-worktree consumer validator;
6. only after all steps pass, mark `UI-1401..UI-1406` and UIR14 DONE and advance UIR15 to NEXT.

Validation failure preserves the repaired/generated state for fix-forward debugging. Planning is not advanced and source is not rolled back.
