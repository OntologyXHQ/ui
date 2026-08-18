# OXS UI Platform — Privileged input/system-surface contract

Status: **UIP15 visual surface implemented**. Native/runtime integration is accepted in UIP16/UIP17 and final proof is required by UIP23.

## 1. Authority boundary

Privileged input surfaces are not application widgets.

```text
Editable Component
      ↓
UI editing/session contract
      ↓
Native compositor / text-input / IME authority
      ↓
System-surface state + commands
      ↓
OXS System UI surface composed from Components
```

React/System UI owns visual composition. The compositor/native input stack owns protocol lifecycle, physical-device state, focused text-input authority and trusted command routing.

## 2. Touch keyboard

The on-screen keyboard is a privileged System surface. UIP15 now supplies its layout/key model, adaptive visual surface, shared press/long-press behavior, secure/content-purpose modes and typed command output. It must:

- be built from public Components/System helpers rather than feature-local controls;
- appear for an eligible focused text input when no usable physical keyboard is present according to native policy;
- hide when policy says a physical keyboard is available or the text session ends;
- support text, password/secure, numeric, email, URL/search and language/layout modes;
- expose Shift/Caps/symbol/modifier/alternate/repeat states;
- remain touch-first and never require hover;
- respect logical direction, safe areas, output geometry and occlusion;
- publish occlusion/insets so focused content is not silently hidden behind the keyboard;
- never directly mutate DOM text as a bypass around the text-input/IME bridge.

UIP15 freezes `SystemKeyboardSurfaceState` as compositor/native-owned input and `SystemKeyboardCommand` as UI output. UIP16 owns routing those commands to the native editing/IME authority and physical-keyboard-aware visibility policy.

## 3. Secure input

Secure text sessions are explicit state, not visual convention. Secure mode must prevent prohibited surrounding-text, clipboard, suggestion/learning or inspection behavior across both UI and native boundaries. Visual hiding alone is insufficient.

## 4. IME/text-input

The editing bridge must support session identity, content purpose/hints, surrounding text, selection, composition/preedit, commit, delete-surrounding-text and cancellation without making React authoritative over the Wayland/native protocol lifecycle.

## 5. Cursor

The first-class system cursor remains centrally owned. Components declare semantic cursor roles; native/compositor ownership resolves theme, scale, hotspot, visibility and output transitions. Feature CSS must not create independent cursor policy.

## 6. Runtime-sensitive acceptance

Static shape checks cannot close:

- physical-keyboard-aware keyboard visibility;
- IME composition/commit behavior;
- secure-input leakage boundaries;
- keyboard occlusion/content inset behavior;
- pointer/hotspot/hit alignment across output resize/fractional scale.

Those requirements remain open until real runtime acceptance exists. The nested fixed-scale workaround is development debt, not final cursor/input architecture.
