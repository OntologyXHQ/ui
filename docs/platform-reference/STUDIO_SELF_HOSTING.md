# OntologyX UI Studio — Self-hosting contract

Status: **canonical from UIP11; implemented in UIP13 and proven again in UIP23**.

## Principle

The Studio is the first developer application of `@ontologyx/ui`. It must not maintain a second reusable UI system beside the package it documents.

Production-shaped dependency direction:

```text
Vite / React mount + generated catalog tooling
                    ↓
                  UiRoot
                    ↓
                @ontologyx/ui
                    ↓
      all reusable visible Studio chrome
```

## Must dogfood `@ontologyx/ui`

As the corresponding public Components become available, the Studio must consume them for:

- page/scaffold/layout composition;
- navigation, lists, tabs and search;
- buttons, icon actions and selection controls;
- fields/forms and playground controls;
- cards/panels/content states;
- dialogs, sheets, popovers, menus, tooltips and transient feedback;
- scroll containers;
- System-surface previews where the Studio demonstrates System UI.

The Studio may add Studio-specific composition classes, example/demo fixtures and visualization-only decoration, but it may not create a reusable control family that competes with `@ontologyx/ui`.

## Allowed outside the UI Kit

Minimal development/bootstrap responsibility may remain local:

- React/Vite mounting and URL routing glue;
- generated-catalog loading/search indexes;
- error boundaries and developer diagnostics;
- example sandbox/fault-isolation plumbing;
- visualization scaffolding whose only purpose is to demonstrate a production component.

These exceptions are not permission to implement raw reusable navigation, form, overlay or control systems.

## Migration rule

Finding a Studio-only reusable control is evidence of one of two things:

1. an existing public Component should replace it; or
2. a real generic capability is missing and must be added to Components before Studio keeps a private equivalent.

UIP13 performs the full migration. UIP22 deletes surviving parallel UI. UIP23 requires an explicit enumeration of the tiny bootstrap-only residue before V1 can close.
## UIP13 implementation

UIP13 closes the Studio-side ownership gap with one generated workbench:

- `UiKitStudio` mounts one `StudioEnvironmentProvider` and one generated `CatalogPage`; it no longer owns a hand-maintained view switcher.
- the left navigation is generated from catalog layer/category/status/order metadata and rendered with public `SearchField`, `ListSection`, `ListItem`, `Badge`, `Surface` and `ScrollView`; its header/search region is fixed while the catalog body owns scrolling.
- taxonomy is source-owned and normalized: Components use Actions, Selection, Fields, Navigation, Data & collection, Feedback, Overlays, Interaction and Composition; System uses Foundations, Surfaces, Layouts, Chrome and Privileged.
- detail pages use public `AppBar`, `Tabs`, `TabPanel`, typography, surfaces and layout primitives while rendering generated import/API/JSDoc/deprecation and cross-axis guidance.
- playgrounds auto-create safe scalar controls and may use source-owned option/fixture metadata for named or complex props; broken previews stay inside `CatalogErrorBoundary`.
- the global environment toolbar owns theme/custom-theme, direction, density, motion, modality, pointer precision, viewport, content-container and safe-area/occlusion simulation at the outer `UiRoot`, so examples inherit the same environment without bespoke wiring.
- deep links use `entry`, `tab`, `example` and `state` URL parameters; search indexes names, categories, summaries, guidance, props/types/defaults/JSDoc and examples.
- `scripts/check-ui-studio-self-hosting.py` fails if raw reusable controls, a parallel view switcher, missing generated ownership, missing scroll ownership or stale category/order metadata return.

Historical diagnostic pages may remain source-visible until UIP22 cleanup, but their old parallel navigation was removed; they only expose a compatibility route back to the generated workbench.

