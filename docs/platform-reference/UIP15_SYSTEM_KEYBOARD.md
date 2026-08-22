# UIP15 — Privileged System touch keyboard

Status: **UIR15 closeout contract implemented; canonical G6 + real OXS validation required before roadmap DONE**.

UIP15 closes `OXUI-091..096` without taking native text-input authority into React.

## Ownership

`SystemKeyboardHost` is a privileged OXS System surface. The compositor/native layer supplies `SystemKeyboardSurfaceState` (`surfaceId`, focused `sessionId`, visibility, language, layout, content purpose and secure state). The visual surface emits `SystemKeyboardCommand`; it never finds a DOM input or mutates text directly.

Ordinary Shell feature code may not mount the keyboard. UIP16 may connect it only from the Shell/system application boundary to the native text-input/IME bridge.

## Model

`systemKeyboardLayouts` freezes stable, geometry-free key identities for English, Persian, symbol and numeric planes. Keys carry semantic kind/action/value/alternate/repeat metadata; CSS owns geometry.

## Interaction

Keyboard keys are real public `Button` Components. `Button` now exposes the existing shared press kernel's long-press and press-state callbacks so keyboard alternate/repeat behavior uses the common Gesture Arena and cancellation semantics rather than a private gesture engine.

Shift uses one-shot and Caps states. Symbol/language changes are requests through the typed command boundary. Repeatable keys start repeat only after canonical long press, schedule repetition in the concrete owner Window realm, and stop when shared press state ends or compositor-owned visibility/session state is withdrawn.

## Adaptive / secure

The key plane is container-adaptive, touch-first and persistent-safe-area aware. It declares block-end content occlusion to the host but never consumes the transient keyboard occlusion that it is responsible for producing. Persian layout uses RTL key-plane direction independently of host/system logical geometry. Numeric, email, URL, search, password and ordinary text purposes select allowed visible affordances. Secure/password state suppresses alternate-character UI; suggestion/learning surfaces are intentionally absent in UIP15.

## Studio acceptance

`SystemKeyboardHost` has a source-owned canonical Studio example and a real-export Playground fixture. The example controls language, content purpose and secure state while modifier, symbol/language request, alternate and repeat interactions exercise the production implementation. Studio's existing environment controls supply phone/tablet/desktop, RTL, coarse-pointer and safe-area axes.

## Deferred to UIP16

- native text-input/IME protocol lifecycle;
- command injection into the focused native text session;
- physical-keyboard-aware auto-show/hide policy;
- secure surrounding-text/clipboard boundary enforcement across native/UI;
- native transport of measured keyboard occlusion into the compositor/environment after the UI surface reports its explicit occlusion role.
