# OXS UI Primitive Contract — UIP05

Primitives are the lowest visual vocabulary above Foundations. They may express only structure/layout, typography, material/separation, and icon rendering. They never own product, application, system-surface, navigation, field, action, selection, overlay, or workflow semantics.

## Frozen runtime allowlist

- Layout: `Box`, `Stack`, `Row`, `Wrap`, `Grid`, `Container`, `Inset`, `SafeArea`, `Spacer`
- Typography: `Text`, `Heading`, `Label`, `Code`
- Structure: `Surface`, `Divider`
- Iconography: `Icon` plus the non-visual `defineUiIcon` glyph helper

## Escape hatch policy

Public Primitive props intentionally exclude inline `style`. Values that belong to the design language must be expressed through Foundations tokens or typed Primitive props. `className` remains the narrow composition escape hatch for selectors owned by `@oxs/ui` and the development-only Studio; it is not a replacement for feature-local visual systems.

## Classification of the pre-UIP05 surface

`Stack`, `Row`, `Grid`, `Container`, `Inset`, `SafeArea`, `Spacer`, `Text`, `Heading`, `Label`, `Surface`, and `Icon` stay and are closed here. `Box`, `Wrap`, `Code`, and `Divider` fill missing generic vocabulary. Current app/category glyphs remain generic icon data rather than app behavior. Action controls, fields, menus, sheets, scrolling, gestures, editing, drag/drop and cursor ownership remain above or beside Primitives and are not Primitive APIs.
