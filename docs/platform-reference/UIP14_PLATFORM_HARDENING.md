# OXS UI Platform — UIP14 First-stage cleanup + measured hardening

Status: implemented; real-workspace TypeScript/Vitest/Vite validation and visible Studio acceptance remain the delivery proof.

## Why this patch also revises UIP13 Studio presentation

The first self-hosted Studio build proved the ownership boundary but exposed two acceptance defects: the environment toolbar could compress Select fields until their text overlapped, and the generated Playground could show a technically mounted export without making the actual component legible/useful. UIP14 starts by fixing those defects rather than hardening an unreadable workbench.

Every catalog page now presents a **Live component** surface on Overview and a larger interactive preview in Playground. The preview always renders the real canonical `@oxs/ui` export when required props can be safely generated. Complex exports use source-owned fixture metadata or the first colocated canonical example. No public export is allowed to fall back to a text-only “cannot preview” state. Controlled `value/query/checked/pressed/selected/open` seams are rebound to Studio state so the preview remains interactive rather than frozen.

The environment controls now use a responsive grid of real UI Kit `Select` Components. They never collapse into overlapping labels; the layout moves 3 → 2 → 1 columns by available Studio width.

## OXUI-085 — public coverage matrix

The generated workbench surfaces theme, RTL, responsive/container, touch, mouse, keyboard/focus, reduced-motion and state coverage per public export. Component/System exports must keep accessibility/RTL/touch/responsive declarations, and every public export must resolve to a real fixture mode (`playground`, generated-safe props or canonical example).

## OXUI-086 — deterministic fixture/layout regression set

`python3 scripts/generate-ui-fixture-matrix.py` generates `apps/ui-studio/src/catalog/generated/fixture-matrix.generated.json`. Each public export receives stable capture axes. Interactive exports get representative desktop/LTR/full-motion, tablet/RTL/reduced-motion and phone/reduced-motion fixtures plus applicable state names. The check mode rejects stale or unrenderable fixtures without snapshotting meaningless implementation details.

This matrix is the deterministic source for later browser/pixel certification; UIP14 does not pretend that a JSON manifest itself is a pixel screenshot.

## OXUI-087 — accessibility hardening

Accessibility guidance remains source-owned and mandatory for Component/System catalog entries. The hardening gate also keeps Studio chrome free of raw reusable controls so semantic behavior is exercised through public Components. Existing Vitest semantic/focus/overlay/field/selection suites remain authoritative automated runtime coverage. No extra audit dependency is added at UIP14 because the current suite already owns semantics and adding a second DOM/runtime stack only for a badge would increase dependency/runtime cost without replacing manual keyboard/touch review.

## OXUI-088 — production budgets

`docs/ui-platform/UIP14_BUDGETS.json` freezes first-stage ceilings for production TS module count/bytes, CSS count/bytes, runtime dependencies, peer dependencies, Studio leakage and legacy subpaths. `scripts/check-ui-budgets.py` enforces:

- no direct runtime dependencies in `@oxs/ui`;
- React/ReactDOM remain peers and match the Studio development versions;
- JS remains tree-shakeable via CSS-only `sideEffects`;
- UI Studio cannot enter production UI source;
- no legacy package subpath returns;
- source/CSS growth beyond the reviewed budget fails explicitly.

## OXUI-089 — completed compatibility cleanup

The Shell already consumes `SystemLauncher` and `SystemWorkspace`; canonical `ApplicationItem` already replaced AppTile. UIP14 therefore removes the completed compatibility layer instead of carrying dead wrappers to UIP22:

- `@oxs/ui/legacy` export removed;
- `AppTile` wrapper/docs removed;
- Pattern forwarding directory removed;
- the one remaining responsive tile CSS rule moved into Component CSS;
- B16/B18 static checks now inspect canonical `SystemLauncher`, `SystemApplicationBrowser`, `ApplicationItem`, `SystemWorkspace` and shared overlay runtime owners.

Historical evidence text is not rewritten as if history used the new names.

## OXUI-090 — pre-privileged-surface checkpoint

After this patch the intended frontier is:

1. one production package: `@oxs/ui` plus the intentional `@oxs/ui/advanced` engineering/integration subpath;
2. one dev-only self-hosting UI Studio;
3. generated canonical catalog + deterministic fixture matrix;
4. no completed Pattern/AppTile compatibility path;
5. measured production source/CSS/runtime budgets;
6. UIP15 remains the next product batch: privileged System touch keyboard surface.

This is **not** UI Platform V1 closeout. UIP15..UIP23 still own privileged keyboard/text-input/IME, cursor/system surfaces, production System migrations, cross-axis certification and final cleanup/certification.
