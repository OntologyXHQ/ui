# OXS UI Platform — UIP13 Studio self-hosting + generated workbench

Status: implemented; stable workspace validation runs from the delivery script.

## What changed

The UI Studio is now a developer application built by the UI Kit it documents. Vite/React bootstrap, URL glue, generated metadata, error isolation and visualization scaffolding remain Studio-local; reusable visible controls and interaction surfaces come from public `@oxs/ui`.

### Generated information architecture

Catalog docs own `layer`, `category`, `order` and `status`. The generator carries those values into the Studio, where navigation groups are derived rather than registered by hand. The UIP13 taxonomy deliberately removes the previous overlapping `Forms`/`Fields`, `Data display`/`Collection`, and separate Scroll/Pointer/Gesture/Motion menu buckets.

### Scroll ownership

The Studio shell has two bounded regions. The sidebar owns a fixed identity/search header and a flex-constrained public `ScrollView`; the workspace independently owns its AppBar, environment toolbar and content `ScrollView`. Every flex/grid ancestor uses `min-height: 0`, so neither scroll region depends on document-body scrolling.

### Workbench

Every public catalog entry gets the same generated tabs: Overview, API, Examples and Playground. API content is generated from TypeScript metadata, examples remain lazy/fault-isolated, and the playground seeds only safe props unless docs provide explicit options/static fixtures for complex values.

### Environment

The toolbar changes the outer `UiRoot`: theme/custom tokens, LTR/RTL, density, motion, input modality, pointer precision, viewport preset, content-container preset and safe-area/occlusion preset. Examples require no environment-specific code.

### Stable links and search

`?ui-kit=1&view=catalog&entry=<export>&tab=<section>&example=<id>&state=<state>` remains the canonical Studio URL shape. Search includes component names, categories, summaries, usage, all cross-axis guidance, prop names/types/defaults/JSDoc/deprecation and example metadata.

## Acceptance gates

- generated catalog freshness/discovery;
- `scripts/check-ui-studio-self-hosting.py`;
- UI architecture/runtime/motion/System ownership/quality gates;
- `@oxs/ui` TypeScript + tests;
- `@oxs/ui-studio` TypeScript + build.

UIP14 starts only after these gates pass on the real workspace and the revised workbench is visually accepted.
