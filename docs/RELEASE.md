# Release Contract

## Identity

- GitHub repository: `OntologyXHQ/ui`
- npm package: `@ontologyx/ui`
- license: MIT
- Studio: `https://ontologyxhq.github.io/ui/`
- V1 stable line: `1.0.0` and later stable versions publish with npm dist-tag `latest`

## Canonical local V1 closeout

```bash
pnpm install --frozen-lockfile
OXS_CONSUMER_ROOT=/path/to/OXS pnpm v1:closeout
```

`v1:closeout` is fix-forward: it formats and regenerates first, runs full G0..G7 release acceptance, emits the packed stable candidate, freezes/checks artifact budgets from measured V1 output, then validates that tarball in an isolated copy of the current OXS consumer supplied by `OXS_CONSUMER_ROOT`. Only after all of those gates pass does it record UIR11–UIR16 as DONE and the local UIR17 freeze tasks as complete. Validation failure preserves implementation/generated/formatted state and does not roll source back; failed isolated OXS state is retained for diagnosis.

The local closeout proves the artifact users receive: explicit CSS consumption, Node/SSR-safe imports, tree-shakeable ESM package exports, types, a clean fresh consumer install, Vite production build, production Studio, and the real-browser certification matrix.

## Measured V1 artifact budgets

The first successful V1 closeout freezes `docs/quality/V1_ARTIFACT_BUDGETS.json` from the actual built package, Studio and packed tarball. Limits are derived from those measured outputs with a small documented headroom instead of inherited arbitrary ceilings. Later release checks preserve that baseline and fail on regressions unless the budget file is explicitly reviewed/rebaselined.

## Stable publication

Registry publication is an explicit release operation after local closeout and real OXS release-candidate validation. The tagged release workflow verifies tag/package identity and publishes through npm Trusted Publishing; stable versions use `latest`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow must not publish a tag whose version differs from `packages/ui/package.json`. `scripts/check-release-tag.mjs` is the canonical identity check.

## Real OXS consumer

Before moving the stable npm `latest` tag, `v1:closeout` validates the generated local tarball against the current OXS consumer rather than source-linking the UI repository. `scripts/validate-oxs-consumer.mjs` copies the current consumer into an isolated temporary root, rewrites only that copy to consume the packed candidate, performs an offline pnpm install, and runs the consumer's canonical `pnpm verify`. The original OXS source tree is never modified. Failure evidence is retained under `artifacts/oxs-consumer-validation/` and the isolated failing copy is preserved. The OXS verification remains a consumer/release operation so this standalone repository never gains product imports or compositor/native authority.

## Production Studio

`pnpm studio:build` generates the catalog, builds the Studio, and validates the static production artifact. `pnpm studio:preview` serves the built artifact locally. The Pages workflow deploys `apps/ui-studio/dist`; custom-domain/root deployments set the repository base-path variable rather than hard-coding routes in Studio source.
