# Changelog

## Unreleased — UIR01 browser acceptance
- UIR01 follow-up: fixed the real phone Studio layout collapse exposed by browser hit-testing: the nine environment selectors now stay in one horizontally scrollable public Toolbar strip instead of consuming the workspace vertically, and G6 rejects a documentation viewport smaller than four 44px touch-target rows.
- UIR01 follow-up: made CDP touch targeting distinguish intersection visibility from hit-test visibility by explicitly centering the real target in nested scroll containers before deriving coordinates; G6 now reports the concrete occluding element if ownership is still lost, and an adversarial fixture proves recovery from a fully-intersecting but center-occluded target.
- UIR01 follow-up: made touch long-press acceptance target the deterministic ContextMenu example, scroll the real target into its nested ScrollView viewport, and assert browser hit-test ownership before CDP touch dispatch; added an adversarial nested-scroll self-test so offscreen geometry cannot masquerade as a product long-press failure.
- UIR01 follow-up: corrected semantic tertiary text contrast after the real-browser Axe gate exposed sub-AA supporting copy in the Studio and public List components; the shared readable tertiary token now has AA-safe light/dark contrast and the browser harness includes an adversarial color-contrast self-test.

- Fixed the Studio browser-host composition contract so the stylesheet-neutral public package is explicitly styled via `@ontologyx/ui/styles.css`; G4 and an adversarial G6 self-test now prevent unstyled public UI from being certified.
- Studio-loaded docs examples now instantiate runtime UI exclusively through the public `@ontologyx/ui` package, preventing source/package context splits (notably portal/overlay ownership); G4 enforces the boundary and G6 fails fast on isolated example-load errors.

- Added G6 production browser acceptance backed by `playwright-core` and an installed system Chrome/Chromium; no browser download dependency is introduced.
- Added blocking serious/critical axe scans plus semantic keyboard/focus, modal isolation/restoration, pointer cancellation, touch long-press, environment and reflow assertions.
- Added adversarial browser-harness self-tests using intentionally broken ephemeral fixtures that never count as component certification.
- Added source-bound JSON evidence under ignored `artifacts/browser-acceptance/` and enforced explicit component-owned G6 coverage before any future export may remain `accepted`.
- Made Studio workbench routes explicitly identifiable/deterministic for browser fixtures while preserving public `@ontologyx/ui` self-hosting.
- Removed stale pre-rename `@oxs/ui` Vite aliases from the standalone Studio.

## Unreleased — UI rebaseline

- Reset the active UI roadmap from zero; pre-reset implementation is candidate material, not accepted completion.
- Replaced legacy `stable`/`provisional` catalog maturity claims with `candidate`.
- Introduced stable architecture/catalog/type/behavior/Studio/build/release gate ownership.
- Removed unreachable legacy Studio pages/galleries and the synthetic fixture-matrix gate.
- Added `pnpm verify` and a fast `pnpm snapshot` tracked-source handoff command.

## 0.1.0-beta.1 — OntologyX public beta

- Published the standalone UI platform as `@ontologyx/ui` under the OntologyX npm organization.
- Adopted the MIT License and canonical `OntologyXHQ/ui` repository identity.
- Kept published JavaScript stylesheet-neutral and CSS host-owned through `@ontologyx/ui/styles.css`.
- Preserved the 100-export self-hosted Studio/catalog contract and UIP15 System Keyboard frontier.
- Added public beta/`latest` release-channel handling, npm Trusted Publishing readiness, and GitHub Release creation.

## 0.1.0 — Standalone extraction seed

- Extracted the UI platform and self-hosted UI Studio from OXS.
- Converted package exports from source paths to built ESM/declaration/CSS artifacts.
- Added pack validation and real tarball consumer smoke.
- Preserved the 100-export generated Studio/catalog contract and UIP15 System Keyboard frontier.
- Established host-neutral boundaries for UIP16+.
