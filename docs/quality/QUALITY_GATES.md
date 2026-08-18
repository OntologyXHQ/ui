# OntologyX UI quality gates

This repository is being reaccepted from zero. Existing code is implementation inventory, not proof of quality. No public visual export is grandfathered as accepted because it existed before the rebaseline.

## Gate model

The gate system protects long-lived engineering properties. It must not grow by appending patch IDs, source-text markers, screenshots of success, or one-off assertions for a single delivery batch.

### G0 — architecture

`pnpm gate:architecture`

Protects repository and package ownership:

- standalone UI repository boundary;
- `@ontologyx/ui` public package identity and dist-only exports;
- zero production runtime dependencies, with React/ReactDOM as peers only;
- explicit stylesheet export and CSS-only side effects;
- four public visual layers: Foundations → Primitives → Components → System UI;
- internal engines may support Components but may not depend on Primitives, Components, or System UI;
- System UI may consume Components but not Primitives directly;
- production source cannot depend on Studio or OXS/product internals.

### G1 — catalog acceptance

`pnpm gate:catalog`

The generated catalog is source-derived and must be fresh. Every public visual export has an explicit lifecycle status:

- `candidate` — present but not yet reaccepted after the reset;
- `accepted` — reviewed and eligible for stable SDK use;
- `experimental` — intentionally unstable exploration;
- `deprecated` — scheduled for removal.

An `accepted` export must have complete usage/accessibility/RTL/touch/responsive guidance, documented public props, and a real render path through an example or explicit playground fixture. Old `stable` / `provisional` claims are forbidden.

The catalog gate is intentionally strict only for `accepted` exports. This is not a waiver system: the reset starts with zero accepted visual exports, and each later part promotes exports only after its complete acceptance matrix passes.

### G2 — types

`pnpm gate:types`

Both the package and Studio must typecheck. Type errors cannot be hidden behind generated output, casts added only to satisfy the gate, or skipped files.

### G3 — behavior

`pnpm gate:behavior`

Runs host-safety plus unit/interaction/runtime tests. Tests must assert observable behavior, not implementation text. A defect repaired in a public interaction contract requires a regression test at the lowest owner that can reproduce it.

### G4 — Studio integrity

`pnpm gate:studio`

The Studio is a real consumer, not a second component library:

- every TS/TSX module must be reachable from `main.tsx` unless it is an ambient declaration;
- reusable controls must come from `@ontologyx/ui`;
- raw `<button>`, `<input>`, `<select>`, and `<textarea>` are forbidden in Studio source;
- product/host internals and source deep-imports are forbidden;
- the Studio may orchestrate state/data but may not own a parallel visual SDK.

### G5 — build/package

`pnpm gate:build`

Builds the publishable package and production Studio and validates the packed package surface. This proves emitted JS/types/CSS and package exports, not only source compilation.

### G6 — browser acceptance

Introduced in `UIR01` before the first public visual export can become `accepted`.

It will exercise real browser behavior across applicable axes:

- keyboard and focus;
- pointer and touch;
- RTL/LTR;
- narrow/medium/wide containers;
- light/dark/custom theme scopes;
- reduced motion;
- zoom/reflow and accessibility scanning;
- overlay/focus restoration and form semantics where applicable.

Until G6 exists, public visual exports remain `candidate` even if unit tests pass.

### G7 — release

`pnpm release:check`

Extends the full repository verification with production Studio artifact checks and a fresh packed-tarball consumer install/typecheck/Node-import/Vite-build smoke. Release checks must operate on the artifact users receive.

## Canonical commands

```bash
pnpm quality        # G0..G3: fast canonical development gate
pnpm verify         # G0..G5: full repository acceptance
pnpm release:check  # G0..G5 + release artifact/consumer proof
```

Focused gates may be rerun while debugging, but a part cannot close on a focused rerun alone.

## Non-negotiable acceptance rules

1. **No grandfathering.** Existing exports begin as `candidate`.
2. **No fake coverage.** Metadata inference is not evidence of browser behavior.
3. **No marker gates.** A check may parse source structure or artifacts, but may not pass because a magic phrase exists in a file.
4. **No test weakening.** Repair production behavior or the test model; do not loosen assertions to make a gate green unless the old assertion was semantically wrong and the replacement proves the correct contract.
5. **No hidden compatibility debt.** Beta-stage breaking API cleanup is preferred over permanent aliases/shims when the old contract is wrong.
6. **No Studio exception.** Studio must dogfood the same public UI surface available to consumers.
7. **No platform impersonation.** Native/compositor authority stays with the host; this repository owns only host-neutral contracts and UI behavior.
8. **No release from source-only confidence.** Packed-artifact consumer proof is mandatory.
9. **Fix forward.** Failed validation preserves the working state for diagnosis; automated rollback is not part of the delivery flow.
10. **One definition of done.** A task is complete only when its code, tests, docs, Studio representation, applicable browser axes, and package boundary agree.
