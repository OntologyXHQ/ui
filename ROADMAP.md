# Roadmap

Current extraction frontier: **UIP15 implementation**, including the final known Studio `SystemKeyboardHost` contract repair.

The detailed carried roadmap is `docs/roadmap/UI_KIT_TASK_LIST.md`.

## Next

**UIP16 — text input / IME / secure input / occlusion** is split by ownership:

- this repository: reusable contracts, UI state/visual behavior, host-neutral adapters, Studio acceptance;
- host/product repositories: Wayland/compositor/native IME lifecycle, physical-keyboard detection, native occlusion source, process/surface integration.

Do not move host implementations back into `@ontologyx/ui` merely to make the standalone package self-sufficient.
