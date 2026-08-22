# UIR13 Developer Composition Audit

UIR13 closes the developer-facing composition layer without inventing product semantics or one-line wrapper APIs. The accepted dependency floor is UIR00–UIR12. Runtime/native/compositor ownership remains outside these compositions.

## Closure decisions

| Task | Decision | Evidence |
| --- | --- | --- |
| UI-1301 | Keep only compositions that add semantic structure, interaction ownership, or adaptive layout. Do not add `Section`, `ContentRegion`, `Sidebar`, or `SplitView` aliases whose behavior is already expressed by semantic HTML plus accepted layout primitives. | `Compositions.tsx`, `Navigation.tsx`, `check-developer-compositions.mjs` |
| UI-1302 | `Card` owns labelled/described grouped content; `ContentState` owns empty/error/loading replacement semantics; generic sectioning remains native section/heading composition; PageScaffold's named main/region is the reusable content-region contract. Existing UIR10 `EmptyState` remains the dedicated empty-only helper instead of being duplicated. | Card/ContentState/PageScaffold source + catalog ownership |
| UI-1303 | `PageScaffold` owns logical sidebar/split behavior through container queries and start/end placement. `AppBar` now adapts from its own measured inline container: narrow layouts move copy to a full row and release truncation. No viewport/device sniffing is introduced. | `components.css`, AppBar/PageScaffold Studio examples, G6 UIR13 scenario |
| UI-1304 | The realistic PageScaffold example contains a genuinely overflowing nested `ScrollView`; G6 proves min-inline/min-block boundaries, no horizontal overflow, and that wheel input changes the nested viewport rather than requiring scaffold-owned scrolling. | `ScaffoldExample`, `developer-compositions-adaptive-certification` |
| UI-1305 | Runtime composition source contains no demo/product vocabulary and imports no System UI. Titles, descriptions, actions, application identity and selection remain caller-owned. | source audit + G0 developer-composition gate |
| UI-1306 | Studio examples model a reusable developer workspace, adaptive application header, application tile collection, and content replacement states. Acceptance no longer relies on isolated placeholder rectangles. | `Compositions.docs.tsx`, `DataNavigation.docs.tsx`, Studio CSS, G6 |

## Export audit

### UIR13-owned V1 exports

- `Card` — semantic grouped content with labelled/described relationships and caller-owned regions.
- `PageScaffold` — header/sidebar/content/footer landmarks plus logical, container-driven sidebar adaptation.
- `ApplicationItem` — reusable application identity layered over the accepted Tile/Button contract; no launcher/search/routing ownership.
- `ContentState` — generic empty/error/loading replacement presentation with caller-owned copy/actions.
- `AppBar` — semantic application header with caller-owned leading/title/actions and container-driven narrow adaptation.

### Existing compositions intentionally retained under earlier owners

- `Disclosure`, `Accordion` — UIR08 selection/disclosure ownership.
- `TileGrid`, `Tile` — UIR09 navigation/data and measured spatial focus ownership.
- `EmptyState` — UIR10 feedback ownership.
- `ScrollView` — UIR11 scroll runtime ownership.

UIR13 composes these accepted contracts; it does not re-own them.

## Intentionally absent wrapper APIs

- `Section`: native `<section>` plus `Heading`/layout primitives already carries the semantic structure; a new wrapper would add no behavior.
- `ContentRegion`: `PageScaffold` exposes a named `main`/`region`; standalone regions remain native semantic HTML.
- `Sidebar`: PageScaffold's logical sidebar slot owns the adaptive relationship. A standalone visual wrapper would not know the surrounding content relationship.
- `SplitView`: UIR13 requires container-driven developer scaffolding, not an unconstrained generic splitter/resizer. A future split interaction must enter through a real capability demand and interaction contract.

These absences are deliberate V1 API decisions, not missing implementation.

## Acceptance contract

UIR13 is DONE only when:

1. the dedicated G0 developer-composition gate passes;
2. all five UIR13-owned exports are `accepted`, have UIR13 certification records, and are claimed by `developer-compositions-adaptive-certification`;
3. the realistic Studio fixtures are present;
4. the full canonical `pnpm verify` passes on the real machine;
5. planning is advanced to UIR14 only after that successful verification.
