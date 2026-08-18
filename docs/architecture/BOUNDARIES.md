# Standalone UI Boundaries

## Ownership

```text
Foundations → Primitives → Components → System UI
                                  ↓
                      runtime-neutral contracts
```

`packages/ui` owns reusable visual/runtime-neutral UI. `apps/ui-studio` is a development/documentation consumer and must self-host on the public UI kit.

The standalone repository does **not** own compositor/Wayland/native IME/physical-keyboard detection, process lifecycle, shell routing, or product data. Those belong to host consumers such as OXS and connect through typed adapters/contracts.

## Dependency rules

- Production UI has zero runtime dependencies beyond React/React DOM peers.
- System UI consumes public Components, not Primitives directly.
- Studio may consume `@oxs/ui`, `@oxs/ui/advanced`, and source-owned docs metadata only.
- No production source may import product repository internals.
- Published package exports resolve only to `dist`.
- Tarball consumer smoke is mandatory before release.
