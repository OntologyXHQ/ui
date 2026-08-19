# OntologyX UI roadmap

The UI roadmap was reset from zero on 2026-08-19 against Git baseline `fa05bb1a829851ac83df6a956dbce091cc128819`.

The previous UIP00..UIP23 roadmap is no longer an active completion record. It remains historical extraction context only. Existing implementation is treated as candidate material and must be reaccepted under the new gate model.

Canonical plan: [`docs/roadmap/UI_TASK_LIST.md`](docs/roadmap/UI_TASK_LIST.md)
Canonical gate contract: [`docs/quality/QUALITY_GATES.md`](docs/quality/QUALITY_GATES.md)

## Frontier

- `UIR00` — Rebaseline, truth reset and gate constitution: **DONE**
- `UIR01` — Real browser acceptance harness: **DONE**
- `UIR02` — Foundations reacceptance: **DONE**
  - `UIR02-A` — Semantic token architecture: **DONE**
  - `UIR02-B` — Environment semantics: **DONE**
  - `UIR02-C` — UiRoot certification: **DONE**
- `UIR03` — Layout primitives redesign: **DONE**
  - `UIR03-A` — Core structural flow (`Box`, `Stack`, `Row`, `Wrap`): **DONE**
  - `UIR03-B` — Grid/Container/Inset/SafeArea/Spacer: **DONE**
- `UIR04` — Visual primitives (`Text`, `Heading`, `Label`, `Code`, `Icon`, `Surface`, `Divider`): **DONE**
- `UIR05` — Interaction/runtime kernel: **DONE**
  - `UIR05-A` — Input authority (Press/Focus/Typeahead/Selection/Gesture Arena): **DONE**
  - `UIR05-B` — Overlay authority: **DONE**
  - `UIR05-C` — Motion authority + kernel closeout: **DONE**
- `UIR06` — Actions and command controls: **DONE**
- `UIR07` — Fields, forms and text input: **NEXT**
- `UIR08+` — Components → System UI reacceptance: **TODO**

- Inter-batch Studio presentation follow-up — stacked generated docs + lazy Canvas OX boot renderer: **DONE** (not a numbered roadmap batch)

No public visual export is considered accepted merely because it existed before this reset.
