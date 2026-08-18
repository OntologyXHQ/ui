# OXS UI Platform — Foundations Contract

UIP02 freezes the cross-cutting environment that every later Primitive, Component and System UI surface consumes.

## One scoped environment

`UiRoot` is both the top-level environment and a container-query boundary. A nested `UiRoot scope="nested"` inherits unspecified environment values and may override theme, direction, density, modality, pointer precision, logical safe areas, motion preference and typed semantic tokens without mutating global application state.

## Theme and customization

Production styling remains static CSS plus CSS custom properties. `UiRoot tokens={...}` maps a typed semantic token vocabulary to scoped `--oxs-*` variables. No CSS-in-JS runtime is required. `system`, `dark`, `light`, and `custom` theme modes share the same semantic token names.

## Direction

Public direction is `auto | ltr | rtl`. Layout spacing and alignment use logical start/end and block/inline properties. Physical coordinates remain valid only for genuine geometry such as pointer positions, viewport collision calculations, and transform coordinates.

Safe-area input is also logical: `blockStart`, `inlineEnd`, `blockEnd`, `inlineStart`. Physical platform insets are normalized by the environment according to direction.

## Container-first adaptation

Every `UiRoot` establishes an inline-size container named `oxs-ui`. Later Components adapt to available container space instead of branching on device names. Reference bands are compact, medium, expanded, and wide; they are layout vocabulary, not product/device identity.

## Touch-first modality

Input modality vocabulary is `keyboard | mouse | touch | pen`; pointer precision is `fine | coarse`. `auto` is a preference mode and resolves to a concrete runtime value. The default minimum usable control target remains 44px and coarse precision raises the active floor to 48px without changing component APIs.

## Quality command

`pnpm quality` checks a fixed set of architectural invariants only:

- allowed UI layer dependency direction;
- public-package boundaries and no deep Shell imports;
- reusable interactive-control ownership inside `@oxs/ui`;
- logical CSS spacing/alignment for RTL;
- no required runtime CSS-in-JS dependency.

It deliberately does not run formatting, TypeScript, tests, builds, planning/evidence, or patch-specific checklists. New patches should fit these invariants instead of growing the command with task-specific gates.
