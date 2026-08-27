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
- Presentation preferences are soft unless semantics require otherwise; resolver policy may adapt them.
- Add durable architecture/behavior gates only. No patch-ID locks, exact-SHA apply guards or validation rollback.
- Applied development changes are fix-forward.

## Closed foundation

- `V2-00` **DONE** — active planning/delivery cleanup; V1 evidence separated from backlog; patch delivery remains context-based and permissive.
- `V2-01` **DONE** — versioned Author IR; deterministic validation; Command Registry; Binding/Source registries; `command-group`, `collection`, `confirmation`, `form`, `field`, `choice`, `toggle`; Runtime IR diagnostics; canonical React bridge; first Studio Author IR → Runtime IR → live UI proof.

## Closed adaptive resolution

- `V2-02` **DONE** — Runtime IR now carries one explicit resolved environment (`container`, `modality`, `density`, `direction`, `pointerPrecision`, bounded capability IDs) rather than host preferences or viewport names; command groups resolve deterministically to inline, inline+overflow or menu while preserving author order and command metadata; semantic choices keep their accepted Select/SegmentedControl/Radio adaptation; dedicated G6 evidence proves the same Author IR across regular pointer, compact touch and wide RTL/keyboard environments.

## V2-03 — semantic collections + workspace model — ACTIVE

- `V2-0301` Formalize collection item identity, selection state, activation command and navigation semantics independently from list/grid presentation.
- `V2-0302` Replace eager collection-array assumptions with a bounded source snapshot contract that can later back virtualization without changing Author IR.
- `V2-0303` Add workspace/region/sidebar/pane/inspector semantics over accepted Component/System surfaces, keeping window/process/native authority in OXS.
- `V2-0304` Prove one realistic file/workspace journey in Studio before expanding Tree/DataGrid breadth.

Exit: collection/workspace meaning is stable without coupling Author IR to DOM layout, eager data ownership or host window authority.

## V2-04 — inspection + AI actionability contract — NEXT

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
