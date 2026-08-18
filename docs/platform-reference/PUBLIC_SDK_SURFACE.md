# OXS UI Platform — Public SDK Surface

Status: canonical after UIP14 pre-privileged-surface hardening.

## 1. Canonical developer surface: `@oxs/ui`

New application and System UI code starts here. The root surface owns:

- `UiRoot` and public adaptive environment contracts;
- Foundations-visible developer contracts intentionally exposed through `UiRoot` rather than provider plumbing;
- Primitives;
- Components;
- System UI compositions;
- selected runtime-backed visual Components such as `CursorRegion`, `MotionTransition` and `SharedBounds`;
- narrow platform integration seams deliberately needed by the production Shell, such as the clipboard adapter type/configuration and drag-reveal hook.

The generated public catalog documents this surface only. An implementation being present in `packages/ui/src` does not make it public.

## 2. Advanced infrastructure surface: `@oxs/ui/advanced`

This subpath exists for platform integration and engineering diagnostics. It can expose lower-level runtime APIs such as cursor, drag/drop, editing, foundations observation/environment plumbing, Gesture Arena internals, interaction/overlay/focus infrastructure, motion and scroll runtimes.

Normal product/System composition must not use this surface to bypass a missing Component. UI Studio diagnostic labs may use it only when their explicit purpose is inspecting a runtime; reusable Studio chrome remains self-hosted on `@oxs/ui`.

## 3. Compatibility surface removal

UIP14 removes the completed Pattern/AppTile compatibility layer. `@oxs/ui/legacy`, `AppTile`, `ApplicationLauncherPattern`, `DesktopWorkspacePattern` and the Pattern forwarding wrappers are no longer package surfaces.

The canonical replacements are `ApplicationItem`, `SystemLauncher`, `SystemWorkspace`, Component overlays (`Sheet`, `Popover`, `Menu`, `Tooltip`, `ContextMenu`) and shared interaction/runtime services. Historical validation evidence may still mention the old names; that evidence is historical text, not a current API contract.

UIP22 still owns removal of any *future/current System migration adapters* that remain necessary through UIP15..UIP20. It does not resurrect the already-removed Pattern compatibility package.

## 4. CSS host contract

Importing `@oxs/ui` must not claim the host document. Production package CSS therefore may not set global layout/overflow/type/tokens on `html`, `body`, `#root` or `:root`.

UI defaults and tokens are scoped to `.ui-root`. Applications that need full-window reset/layout own an explicit app-level stylesheet. This keeps the package embeddable in Studio previews, nested roots and future hosts.

## 5. Portal coordinate contract

The UiRoot portal host is the coordinate plane for floating/overlay/drag visuals. Client/viewport coordinates must be converted into that plane. V1 supports scale + translation. Rotation/skew of the portal containing block is outside the V1 supported contract and must not be silently treated as equivalent to viewport coordinates.

## 6. Catalog and hardening rule

Catalog discovery begins at `packages/ui/src/index.ts` only. Advanced infrastructure does not become canonical because it has source documentation. UIP14 additionally requires every canonical public visual export to have a deterministic real-render Studio fixture path, coverage metadata/guidance and a stable regression-matrix entry. Production bundle/source/CSS budgets are committed in `docs/ui-platform/UIP14_BUDGETS.json` and enforced by `scripts/check-ui-budgets.py`.

## UIP15 privileged keyboard contracts

`SystemKeyboardHost`, `SystemKeyboardSurfaceState`, `SystemKeyboardCommand`, `SystemKeyboardLayoutModel` and `systemKeyboardLayouts` are public System-composition contracts. They are not ordinary application widgets: product feature code must not mount the privileged keyboard. UIP16 consumes the typed state/command seam from the Shell/system boundary and retains native text-input/IME authority.
