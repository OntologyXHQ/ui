# OntologyX UI — V2 active task list

**Baseline:** V1 `ba1662868d12737c64851a796f65ae7ad7ad6af6`

**Package:** `@ontologyx/ui`
**Goal:** evolve the accepted V1 foundation into a semantic UI runtime without rebuilding working interaction, accessibility, motion, overlay or environment infrastructure.

This file is the active frontier, not historical completion evidence.

## Working rules

- Build V2 above accepted V1 contracts; do not rewrite lower layers without a demonstrated gap.
- Author IR is versioned and JSON-serializable. Typed TypeScript helpers are the normal developer API.
- IR expresses semantics and stable capability references, never arbitrary DOM/CSS/functions or business authority.
- Commands, bindings, sources and application mutation remain host-owned registries/adapters.
- Presentation preferences are soft unless semantics require otherwise; adaptive policy belongs to V2-02.
- Add durable architecture/behavior gates only. No patch-ID locks, exact-SHA apply guards or validation rollback.
- Applied development changes are fix-forward.

## Closed foundation

- `V2-00` **DONE** — active planning/delivery cleanup; V1 evidence separated from backlog; patch delivery remains context-based and permissive.
- `V2-01` **DONE** — versioned Author IR; deterministic validation; Command Registry; Binding/Source registries; `command-group`, `collection`, `confirmation`, `form`, `field`, `choice`, `toggle`; typed Runtime IR diagnostics; canonical React bridge; first Studio Author IR → Runtime IR → live UI proof.

## V2-02 — adaptive resolver + presentation policies — NEXT

- `V2-0201` Define one resolved environment contract for container size, modality, density, direction, pointer precision and bounded capabilities.
- `V2-0202` Resolve command-group placement deterministically across inline/overflow/menu without changing command identity, order, availability or shortcut metadata.
- `V2-0203` Resolve choice presentation from soft author preference to canonical Select/SegmentedControl/RadioGroup under environment constraints.
- `V2-0204` Prove the same Author IR across representative environments in the existing G6 browser suite, then freeze only policies that survive real usage.

Exit: applications do not branch on phone/desktop/input mode for supported semantic presentations; the resolver owns that policy over the existing V1 environment/runtime.

## V2-03 — semantic collections + workspace model — TODO

- Formalize item identity, selection, activation and navigation independently from list/grid presentation.
- Make collection sources virtualization-safe before expanding Tree/DataGrid breadth.
- Add workspace/region/sidebar/pane/inspector semantics over accepted System/Component surfaces.

## V2-04 — inspection + AI actionability contract — TODO

- Expose a bounded semantic runtime snapshot: active surface, focus/selection, available commands and relevant state.
- Let AI/automation invoke registered commands by stable identity instead of DOM scraping.
- Keep authorization, data access and mutations in host command implementations.

## V2-05 — Studio V2 — TODO

- Evolve the first semantic fixture into Compose, Inspect and Certify workflows.
- Keep Author IR, Runtime IR and canonical rendering inspectable together.
- Reuse existing keyboard/touch/RTL/reduced-motion/a11y evidence rather than duplicating certification systems.

## V2-06 — enforcement, migration and release — TODO

- Add stable architecture rules only after contracts are proven by real consumers.
- Add migration/codemod support where V2 replaces common V1 compositions.
- Preserve V1 compatibility intentionally until the V2 cutover plan is accepted.
- Close through normal quality, browser, package and real OXS consumer evidence.
