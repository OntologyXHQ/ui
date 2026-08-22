# UIR15 — Privileged System surfaces audit

Status: closeout evidence for `UI-1501..UI-1506`.

UIR15 hardens the System surfaces that sit closest to host/native authority. The batch does not move compositor, notification-delivery, hardware, authentication, text-input/IME, physical-keyboard, persistence, routing or device ownership into React. It proves that the visual surfaces remain Component-built, host-neutral and explicit about logical safe-area/occlusion behavior.

## Scope

The UIR15 visual set is exactly:

- `SystemNotificationCenter`
- `SystemQuickSettings`
- `SystemOsd`
- `SystemCommandSurface`
- `SystemLockLayout`
- `SystemKeyboardHost`

All six remain accepted public System exports and are bound to `privileged-system-surfaces-certification`.

## UI-1501 — touch keyboard visual/state contract

`SystemKeyboardHost` consumes compositor/native-owned `SystemKeyboardSurfaceState` and emits typed `SystemKeyboardCommand` values. It never discovers a DOM input, mutates text, owns IME lifecycle, decides physical-keyboard policy or manufactures a focused session.

Key press/long-press still comes from the accepted Button/Press contract. Keyboard-specific repeat is only post-long-press command repetition: it is scheduled in the rendered keyboard's owner `Window`, is cancelled on press release/unmount, and is now also cancelled whenever native visibility/session/language/layout/purpose ownership changes. The keyboard example is mounted through the canonical `SystemScaffold` privileged slot.

## UI-1502 — notification center and quick controls

`SystemNotificationCenter` renders caller-owned view models and reports activation by stable notification id. Delivery, persistence, permission and action policy remain external. `SystemQuickSettings` only arranges caller-supplied accepted Component controls; network/audio/display/hardware state and mutation policy remain external.

Notification and quick-settings surfaces are container-local compositions. They do not independently consume global output safe-area values; their containing System panel/scaffold owns output-edge placement.

## UI-1503 — OSD/transient lifecycle, accessibility and motion

`SystemOsd` is informational: it exposes polite status semantics plus determinate Progress where supplied, does not capture pointer input, and owns no timeout. Mount/unmount/timing policy remains caller-owned. It has no autonomous animation, so reduced-motion settlement is semantic/static rather than a parallel System motion engine.

`SystemCommandSurface` reuses Dialog/SearchField/List/ScrollView and keeps focus lookup in the concrete owner `Document` instead of the ambient global document. Command discovery/execution authority remains external.

`SystemLockLayout` composes caller-owned authentication controls only; credential validation/session authority remains external.

## UI-1504 — safe area and transient occlusion

The rules are intentionally asymmetric:

- surfaces that must remain reachable above an external occluder (`SystemOsd`, `SystemLockLayout`) avoid the maximum of logical persistent safe-area and transient occlusion inputs;
- `SystemKeyboardHost` consumes persistent logical safe-area padding at the output edge, declares `data-oxs-occludes-content="true"`, and **does not consume the keyboard occlusion that it is responsible for producing**;
- notification/quick-settings remain container-local and rely on their owning System panel/scaffold for output-edge safe-area placement.

No device-name or viewport sniffing is introduced.

## UI-1505 — privileged ownership cannot drift into ordinary feature code

The standalone package cannot and should not invent a fake security token around React components. Ownership is instead proven at the real boundaries:

1. UIR15 production source lives only in the System layer and imports accepted Components/System-local helpers, never Primitives/Foundations/runtime engines.
2. Privileged source contains no browser/native/backend authority such as ambient `document`/`window`, storage, network transport, notification APIs, device discovery or DOM input mutation.
3. The canonical keyboard example mounts through `SystemScaffold.privileged`, making the intended System ownership visible in executable evidence.
4. The real OXS consumer is validated in an isolated worktree: its untouched current baseline first passes the repository-owned root policy gate, then the packed candidate is injected only for direct `@ontologyx/ui` consumer package checks/builds before UIR15 planning advances.

Importing a visual System surface therefore never grants native authority; the caller still must provide explicit state/commands from the owning System boundary.

## UI-1506 — real OXS integration

Closeout packs the already-verified `@ontologyx/ui` candidate and runs `pnpm v1:oxs:check -- <OXS root>`. The validator creates an isolated Git worktree at the concrete OXS `HEAD`, overlays the caller's current tracked changes plus untracked non-ignored files, and first proves that this untouched dependency baseline passes the OXS-owned root `pnpm quality` gate (or legacy `pnpm verify` where applicable). Only after that baseline passes does it inject the packed candidate and run package-local `check`/`build` on each direct `@ontologyx/ui` consumer. This keeps OXS policy/pinning authoritative while proving the release candidate compiles in the real consumer. OXS remains the owner of compositor/native/IME/notification/hardware/authentication policy.

## Acceptance sequence

`pnpm uir15:closeout` performs:

1. canonical catalog regeneration;
2. `pnpm gate:privileged-system-surfaces`;
3. full canonical `pnpm verify` including the strengthened UIR15 G6 journey;
4. packing the already-verified release candidate;
5. real OXS consumer validation;
6. only then `UI-1501..1506 → DONE`, `UIR15 → DONE`, `UIR16 → NEXT`.

Validation failure preserves repaired/generated/formatted implementation state for fix-forward debugging. Planning is not advanced and source is not rolled back.
