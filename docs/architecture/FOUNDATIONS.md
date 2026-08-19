# OntologyX UI foundations contract

UIR02 rebuilds the semantic substrate before any visual primitive is accepted. This file is canonical for the active rebuild; pre-reset `docs/platform-reference/*` material is historical reference only.

## Semantic tokens, not arbitrary CSS variables

`UiRoot tokens={...}` exposes a finite typed theme contract. The public registry is grouped by semantic responsibility through `UI_TOKEN_GROUPS`; `UI_CUSTOMIZABLE_TOKENS` is the flattened machine-readable surface.

A public override value is an explicit CSS custom-property value string. Numbers are not guessed into units. Runtime mechanics such as z-order, gesture/scroll physics, safe-area normalization, control geometry and internal spring parameters remain implementation tokens rather than public theme API.

## Color roles

Color meaning is split by role. A semantic tone never reuses one value for incompatible jobs:

- fill/decorative color: `color-accent`, `color-danger`, `color-success`, `color-warning`;
- readable foreground: `*-text`;
- content placed on a filled semantic surface: `color-on-*`;
- low-emphasis semantic surface: `*-soft`;
- semantic boundary: `*-border`.

This separation is required for independent contrast across dark/light/custom themes. Component CSS consumes semantic variables; raw color literals belong only in `tokens.css`.

## Neutral root substrate

`UiRoot` establishes environment, containment and semantic defaults. It does not paint ornamental brand gradients or decorative glows. Product/application decoration belongs above the foundation layer.

## Themeable groups

The current public override groups are:

- color;
- typography;
- spacing;
- shape;
- material/elevation;
- layout reference values;
- focus-ring geometry.

The token registry is intentionally finite. Adding a token requires a semantic ownership reason; exposing an implementation tuning knob merely because a CSS variable exists is not sufficient.

## Remaining UIR02 work

UIR02-A freezes the token architecture only. The following are still candidate contracts until subsequent slices close them:

- theme/color-scheme inheritance and partial custom themes;
- direction/logical-property rules;
- density, pointer precision and target-size policy;
- container/viewport/adaptive observation;
- safe-area/occlusion normalization;
- reduced-motion semantics;
- nested/SSR `UiRoot` acceptance and final `UiRoot` promotion.
