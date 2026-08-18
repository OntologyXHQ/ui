# OntologyX UI architecture boundaries

## Public visual layers

```text
Foundations → Primitives → Components → System UI
```

This is the only public visual layering model.

- **Foundations** own tokens, theme/direction/environment contracts and non-visual semantic policy.
- **Primitives** own the minimal visual/layout/type/icon/surface vocabulary.
- **Components** are the primary developer-facing reusable SDK and own interaction/accessibility/state semantics.
- **System UI** owns privileged OXS-class compositions and consumes Components, never Primitives directly.

## Internal engines

Interaction, focus/overlay coordination, motion, gestures, scrolling, editing, drag/drop and cursor runtime code are internal infrastructure. They are not a fifth public visual layer.

Allowed dependency direction:

```text
Foundations  → Foundations
Primitives   → Foundations + Primitives
Engines      → Foundations + Engines
Components   → Foundations + Primitives + Engines + Components
System UI    → Components + System UI
```

An engine may not import Primitives, Components or System UI. A System module may not bypass Components to import Primitives or engines directly.

## Repository ownership

`packages/ui` owns reusable host-neutral UI. `apps/ui-studio` is a development/documentation consumer and must self-host on the public `@ontologyx/ui` package API.

This repository does **not** own compositor/Wayland/native IME, physical-keyboard detection, process lifecycle, shell routing, application data or product policy. Those stay in host consumers such as OXS and connect through typed host-neutral contracts.

## Package boundary

- `@ontologyx/ui` is the canonical developer-facing surface.
- `@ontologyx/ui/advanced` is reserved for infrastructure/platform integration that is intentionally not ordinary component API.
- production runtime dependencies remain zero; React and ReactDOM are peers;
- published exports resolve to `dist` only;
- JavaScript entrypoints remain stylesheet-neutral after packaging; consumers import `@ontologyx/ui/styles.css` explicitly;
- the Studio may not deep-import `packages/ui/src` to evade public API constraints.

## Rebaseline maturity

Pre-reset implementation is candidate material. Catalog `accepted` status is the only positive maturity claim after the 2026-08-19 reset, and it is machine-gated by `pnpm gate:catalog` plus the owning part's behavior/browser acceptance.
