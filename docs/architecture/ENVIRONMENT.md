# UI environment contract

OntologyX UI treats environment state as scoped capabilities, not device identity. `UiRoot` accepts preferences and host inputs; Components consume resolved runtime state.

## Preference vs resolved state

The root keeps both sides observable:

| Domain | Preference | Resolved runtime |
| --- | --- | --- |
| theme | `system | dark | light | custom` | theme identity + concrete `dark | light` color scheme |
| direction | `auto | ltr | rtl` | `ltr | rtl` |
| density | `auto | compact | comfortable` | `compact | comfortable` |
| modality | `auto | keyboard | mouse | touch | pen` | concrete active modality |
| pointer precision | `auto | fine | coarse` | `fine | coarse` |
| motion | `system | full | reduced` | `full | reduced` |

`auto` never means “mobile”, “desktop”, or another device class. Auto density resolves from pointer precision; adaptive layout resolves from measured container inline size; system theme/motion resolve from browser capability preferences.

## Theme and color scheme

Dark and light themes own their color scheme. `system` follows `prefers-color-scheme`. `custom` may supply an explicit color scheme; otherwise it inherits the enclosing resolved scheme or the system scheme. Semantic token overrides remain finite and typed through the token registry.

## Direction

Public layout uses logical block/inline properties. `direction="auto"` inherits the enclosing resolved UI direction and then the document direction. Physical coordinates are reserved for engines that genuinely operate in viewport geometry (for example floating-surface transforms); they are not a substitute for logical layout.

## Density, modality, and target size

Density is visual compactness. Pointer precision is an input capability. Modality is the most recent/forced interaction mode. They are separate contracts:

- auto density: coarse pointer → comfortable, fine pointer → compact;
- coarse pointer independently raises the minimum touch-target floor;
- modality changes focus/pointer presentation but does not identify a device.

## Container/adaptive semantics

Every `UiRoot` is a CSS container. The runtime exposes an adaptive band derived from measured root inline size:

- compact: `<= 480px`;
- medium: `481..896px`;
- expanded: `897..1280px`;
- wide: `> 1280px`.

Component layout should prefer CSS container queries. The adaptive band is diagnostic/infrastructure state, not permission to add device-name branches.

## Safe area and occlusion

Persistent safe area and transient occlusion are different host inputs:

- `safeArea`: cutouts/system chrome that define persistent usable bounds;
- `occlusion`: transient blocked regions such as an on-screen keyboard.

Both use logical CSS lengths with explicit units. The environment derives `--oxs-environment-inset-*` as the maximum of the two for Components that must stay reachable. `SafeArea` itself continues to mean persistent safe area only; privileged System surfaces keep their own ownership rules.

## Motion

`motion="system"` resolves once through the shared motion runtime to `full` or `reduced`. CSS and JavaScript consume the same resolved state. CSS must not implement a second `system` branch that can drift from the runtime clock.

## Root nesting, SSR and multi-window safety

`UiRoot` nesting is structural, not a caller-selected visual mode. Roots inherit nesting through React ownership and also detect a containing `.ui-root` after host commit, so independently mounted React islands inside an existing UI root are marked `nested` without a public scope flag. Nested roots inherit environment preferences, safe-area/occlusion inputs and semantic token overrides unless they replace a value, while portal/overlay/editing/cursor/motion ownership is instantiated per root.

Static token CSS remains the source of initial theme substrate. Server rendering uses deterministic fallbacks (`dark`, `ltr`, fine pointer/compact density, full motion when system capability is unknown) so the first hydration render matches the server. Once the root host element commits, capability observation rebinds to that element's concrete `ownerDocument`/`defaultView` and reconciles real system preferences without a recoverable hydration mismatch.

Media-query and modality stores are scoped per `Window`; document-direction stores are scoped per `Document`; ResizeObservers are constructed per owning `Window`. This prevents Studio previews, iframes or other same-process realms from sharing environment state accidentally.
