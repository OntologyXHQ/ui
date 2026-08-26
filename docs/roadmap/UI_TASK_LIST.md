# OntologyX UI — V2 active task list

**Baseline:** `ba1662868d12737c64851a796f65ae7ad7ad6af6`

**Package:** `@ontologyx/ui`
**Goal:** evolve the accepted V1 UI foundation into a semantic UI runtime without rebuilding working interaction, accessibility, motion, overlay or environment infrastructure.

This file contains active work only. Completed V1 UIR history belongs to release/audit evidence, not the current backlog.

## Rules

- Build V2 on the accepted V1 runtime; do not rewrite working lower layers without a demonstrated contract gap.
- Canonical IR is JSON-serializable and versioned. Developer ergonomics come from typed TypeScript helpers, not hand-authored JSON.
- IR expresses meaning and capability, not arbitrary DOM, CSS, event handlers or component internals.
- Behavior lives in registries/adapters; IR references stable IDs.
- Runtime resolution may choose canonical presentation from environment/container/input state, but application business authority stays outside UI.
- Add stable gates for architectural properties only. Do not add patch-ID checks or one-off source-text locks.
- Validation is fix-forward. No automatic source rollback after an applied development change.
- Keep delivery patches rebase-tolerant: no exact snapshot/SHA guard for normal source changes.

## V2-00 — planning and delivery cleanup — DONE

- `V2-0001` Replace the completed UIR backlog with one concise V2 frontier.
- `V2-0002` Keep V1 certification/release evidence as evidence, not active planning.
- `V2-0003` Remove obsolete numbered UIR closeout commands/scripts from the day-to-day workspace contract.
- `V2-0004` Keep patch delivery context-based and fix-forward; no exact-hash apply lock or validation rollback.

## V2-01 — semantic IR + command foundation — ACTIVE

Purpose: establish the smallest useful semantic language and prove that it can drive accepted V1 components without embedding implementation details in the IR.

### Current slice — semantic core

- `V2-0101` Define versioned JSON-serializable Author IR with `command-group`, `collection` and `confirmation` nodes.
- `V2-0102` Add typed `defineUi(...)` and `ui.*` authoring helpers plus deterministic normalization.
- `V2-0103` Add runtime validation/diagnostics that reject unknown kinds, invalid IDs and non-serializable values/functions.
- `V2-0104` Add typed Command Registry with label, intent, shortcut, availability and execution authority outside IR.
- `V2-0105` Resolve Author IR into JSON-serializable Runtime IR with command availability and canonical command metadata.
- `V2-0106` Prove semantic command groups and destructive confirmation can execute through the existing Button/ActionGroup/AlertDialog contracts.
- `V2-0107` Add focused unit/type/public-surface tests; no new patch-specific canonical gate.

### Remaining V2-01

- `V2-0108` Add source/binding references without embedding application values or functions in IR.
- `V2-0109` Add semantic form/choice/toggle nodes after the binding contract is proven.
- `V2-0110` Add first Studio semantic-IR inspection fixture and freeze the V2-01 schema only after real usage review.

Exit: one real semantic vertical slice serializes cleanly, validates deterministically, resolves commands from external behavior authority, renders through existing canonical components, and passes the normal repository gates.

## V2-02 — adaptive resolver + presentation policies — NEXT

- Resolve semantic intent against container size, density, modality, direction and capability context.
- Keep author preferences soft (`preferred`) unless semantics require a fixed presentation.
- Establish deterministic policy for inline actions, overflow/menu and touch-oriented presentation.
- Reuse existing environment/overlay/motion kernels; do not create a parallel runtime.

## V2-03 — semantic collections + workspace model — TODO

- Formalize collection, item, selection, navigation and activation semantics independent of list/grid presentation.
- Add virtualization-safe collection contracts before expanding Tree/DataGrid breadth.
- Formalize workspace/region/sidebar/pane/inspector semantics on top of accepted System/Component surfaces.

## V2-04 — inspection + AI actionability contract — TODO

- Expose a bounded semantic runtime snapshot: active surface, focus/selection, available commands and relevant state.
- Let AI/automation invoke registered semantic commands by stable identity instead of scraping/clicking DOM.
- Keep authorization, data access and application mutation owned by the host/application command implementation.

## V2-05 — Studio V2 — TODO

- Add Compose, Inspect and Certify workflows around the semantic model.
- Show Author IR, resolved Runtime IR and the rendered canonical UI together.
- Surface existing keyboard/touch/RTL/reduced-motion/a11y evidence without duplicating certification systems.

## V2-06 — enforcement, migration and release — TODO

- Add stable architecture rules only after V2 contracts are proven by real consumers.
- Add migration/codemod support for contracts that replace common V1 composition patterns.
- Preserve V1 compatibility intentionally until the V2 cutover plan is accepted.
- Close V2 only through normal quality, browser, package and real OXS consumer evidence.
