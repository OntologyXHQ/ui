# UIR17 — V1 release hardening and freeze audit

UIR17 does not add another feature family. It proves that the reaccepted SDK, Studio, packed package and real OXS consumer all describe the same stable V1 contract.

| Task | Closure proof |
| --- | --- |
| UI-1701 | Generated catalog is exactly 100/100 `accepted`; `CERTIFICATIONS.json` has exact one-for-one coverage and no stale record. |
| UI-1702 | Full G6 evidence must pass every declared journey and retain LTR/RTL, theme, density, responsive/container, pointer/touch/coarse-pointer, keyboard/focus, reduced-motion, accessibility, zoom and realm axes. |
| UI-1703 | G6 plus behavior tests retain nested-root/portal, unmount, reorder, delayed-event invalidation, resize/zoom, interruption and adversarial harness self-tests. |
| UI-1704 | `v1:budgets:rebaseline` measures the final verified V1 package/Studio/tarball output, records UIR17 ownership, then the normal budget gate freezes that exact baseline. |
| UI-1705 | Package artifact checks require ESM-only output, zero runtime dependencies, React/React DOM peers and explicit CSS. Packed smoke adds Node import, SSR render, tree-shaking and one React peer graph. |
| UI-1706 | A brand-new temp consumer installs the packed tarball with strict peers, typechecks it, imports all public subpaths in Node, SSR-renders a public Component and produces a Vite production bundle. |
| UI-1707 | Stable package + private Studio versions agree; README/G7/release docs describe the real V1/OXS/publishing behavior rather than bootstrap-beta or retired clean-worktree assumptions. |
| UI-1708 | UIR17 local closeout revalidates the real OXS RC and stops at `PUBLICATION READY`. A separate publication closeout verifies `v1.0.0`, the npm version and dist-tag `latest` before this task becomes DONE. |

## Publication authority

Local patch/apply and validation are deliberately not registry authority. `uir17:closeout` must never create a Git tag, push, publish npm or mutate npm dist-tags. The existing tagged GitHub workflow owns trusted publication. `uir17:publication:closeout` is verification-only with respect to Git/npm and mutates only local planning after the external state is already true.
