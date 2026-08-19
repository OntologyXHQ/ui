# OntologyX UI Primitive Contract — UIR03/UIR04

Primitives are the lowest public visual vocabulary above Foundations. They may express structure/layout, typography, static material/separation, and icon rendering. They never own product/application semantics, actions, selection, fields, overlays, navigation, workflows, or privileged System behavior.

## Accepted primitive surface

- Layout: `Box`, `Stack`, `Row`, `Wrap`, `Grid`, `Container`, `Inset`, `SafeArea`, `Spacer`
- Typography: `Text`, `Heading`, `Label`, `Code`
- Static structure: `Surface`, `Divider`
- Iconography: `Icon` plus the non-visual `defineUiIcon` definition helper

All of the above are reaccepted under the post-reset G0..G6 model. Acceptance is owned by `docs/quality/CERTIFICATIONS.json`; this document explains the boundary rather than substituting for evidence.

## Escape-hatch policy

Public Primitive props exclude inline `style` and direct color values. Values that belong to the design language are Foundation tokens or finite Primitive props. `className` remains the narrow composition hook required by higher `@ontologyx/ui` layers and the self-hosted Studio; it is not permission for applications to create a second styling system.

## Typography boundary

`Text` is bounded to paragraph/inline semantics, `Heading` keeps native rank independent from visual size, `Label` is intentionally a visual `span` rather than a form-association primitive, and `Code` is bounded to `code | kbd | samp`. Native `dir`/`lang` remain available for bidi/localization. Long unbreakable content uses the explicit finite overflow-wrap contract rather than physical width hacks.

## Icon state and motion boundary

An icon definition is an immutable glyph family. A family may have one static `default` state or multiple stable semantic states. Transitions are declared between stable states and carry an explicit transient-state identity plus an optional transient glyph and a finite visual motion treatment.

`Icon state={...}` always means the requested **stable semantic destination**. Icon owns the temporary visual phase (`stable | transitioning`), source/destination bookkeeping, transition interruption/retargeting, and the transient visual-state identity. Application behavior must never wait for icon animation completion. Reduced motion is consumed from the resolved UiRoot environment; the same semantic state change settles without meaningful visual motion.

The legacy generic `animated`/spinner knob is not part of the Primitive contract. Indefinite progress/spinner semantics belong to Components/feedback primitives above Icon. Directional glyph families declare RTL mirroring once, resolve mirroring from the Icon element’s local `:dir()` state (so nested RTL/LTR subtrees remain independent), and all glyphs render from `currentColor`.

### Optional icon-pack boundary

The broad icon vocabulary is published from `@ontologyx/ui/icons`, not re-exported from the canonical `@ontologyx/ui` entry. The subpath is self-contained, has no third-party runtime icon dependency, and remains composed entirely from the public `defineUiIcon` definition contract. It currently carries 160 distinct static glyph definitions exposed through 244 semantic names/aliases plus 22 multi-state animated families. Static aliases are semantic naming conveniences, not duplicate runtime components.

Applications import only the glyph definitions they need and render them through the one `Icon` primitive. Animated pack families expose only their stable semantic states to callers; transient states remain Icon-owned lifecycle state. The icon pack does not create new catalog visual exports and therefore does not change the 100-entry visual SDK count.

## Surface/separation boundary

`Surface` owns only static material, elevation, radius, border and clipping inputs. Hover, pressed, selected, active, modal, card and other interaction/product states belong to Components. `Divider` owns separator vs decorative semantics, axis, logical inset and finite semantic tone/thickness.


### Icon transition completion

A multi-state `Icon` owns completion as well as visual motion. Stable → transient → stable settlement must not depend on a single CSS event: the active transition node observes its own `animationend`/`animationcancel` boundary, and a realm-scoped bounded watchdog must converge the same transition if that boundary is suppressed. Completion is sequence-scoped so an interrupted transition cannot settle a newer destination.
