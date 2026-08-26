# OntologyX UI architecture boundaries

## Canonical visual layers

```text
Foundations → Primitives → Components → System UI
```

- **Foundations** own tokens, theme/direction/environment contracts and non-visual policy.
- **Primitives** own the minimal visual/layout/type/icon/surface vocabulary.
- **Components** are the primary reusable SDK and own interaction/accessibility/state semantics.
- **System UI** owns privileged OXS-class compositions and consumes Components, never Primitives directly.

## V2 semantic layer

V2 adds a semantic author/runtime layer above the accepted visual SDK rather than inserting another visual layer:

```text
Developer / AI
      ↓
Semantic Author IR + Command Registry
      ↓
Semantic Resolver / Bridge
      ↓
Canonical Components / System UI
```

IR is versioned and JSON-serializable. It may contain semantic structure, stable IDs, capability references and bounded presentation preferences; it may not contain executable functions, arbitrary DOM/CSS or host/business authority. Executable behavior stays in external registries/adapters.

The semantic bridge may consume public Components. Existing Components/System UI do not depend on the semantic layer, so V1 remains usable without adopting V2 authoring.

## Internal engines

Interaction, focus/overlay coordination, motion, gestures, scrolling, editing, drag/drop and cursor runtime code are internal infrastructure. They are not a public visual layer.

Allowed dependency direction:

```text
Foundations  → Foundations
Primitives   → Foundations + Primitives
Engines      → Foundations + Engines
Components   → Foundations + Primitives + Engines + Components
System UI    → Components + System UI
Semantic     → Components + Semantic
```

An engine may not import Primitives, Components, System UI or Semantic. A System module may not bypass Components to import Primitives/engines directly. Existing visual layers may not depend upward on Semantic.

## Repository ownership

`packages/ui` owns reusable host-neutral UI. `apps/ui-studio` is a development/documentation consumer and must self-host through the public `@ontologyx/ui` package boundary.

This repository does **not** own compositor/Wayland/native IME, physical-keyboard detection, process lifecycle, shell routing, application data or product policy. Those stay in host consumers such as OXS and connect through typed host-neutral contracts.

## Package boundary

- `@ontologyx/ui` is the canonical developer-facing surface.
- `@ontologyx/ui/advanced` is reserved for infrastructure/platform integration that is intentionally not ordinary component API.
- Production runtime dependencies remain zero; React and ReactDOM are peers.
- Published exports resolve to `dist` only.
- JavaScript entrypoints remain stylesheet-neutral after packaging; consumers import `@ontologyx/ui/styles.css` explicitly.
- Studio may not deep-import `packages/ui/src` to evade public API constraints.

## Maturity

V1 accepted/certified visual contracts remain the compatibility foundation. New V2 semantic contracts stay active/provisional until their roadmap exit criteria and normal repository gates pass; historical numbered UIR completion is evidence, not active planning.
