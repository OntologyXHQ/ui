# Release Contract

## Identity

- GitHub repository: `OntologyXHQ/ui`
- npm package: `@ontologyx/ui`
- license: MIT
- Studio: `https://ontologyxhq.github.io/ui/`
- V1 stable line: `1.0.0` and later stable versions publish with npm dist-tag `latest`

## Canonical local flow

Keep development acceptance, release-artifact proof, and cross-repository certification separate:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm release:check
```

`pnpm verify` is the canonical G0..G6 repository acceptance. It is non-mutating, checks Biome formatting freshness without enabling the repository-wide lint migration, performs one production build, and then runs the real-browser suite against that build. `pnpm lint` remains an explicit cleanup gate until its existing rule debt is resolved deliberately.

`pnpm release:check` extends the same verified state with the G7 artifact checks: production Studio inspection, deterministic `@ontologyx/ui` tarball creation, a fresh generic packed-tarball consumer smoke, the reviewed V1 artifact budgets, and the V1 freeze contract. It does **not** format source, regenerate documentation, rewrite roadmap/task files, clone OXS, or freeze/rebaseline budgets.

Mutating maintenance is explicit:

```bash
pnpm format             # formatter only
pnpm lint               # explicit repo-wide Biome lint/debt audit
pnpm catalog:generate   # regenerate checked-in catalog output
pnpm v1:budgets:freeze  # explicit reviewed budget rebaseline only
```

`pnpm v1:closeout` remains a compatibility command, but it is validation-only and simply runs `pnpm release:check`. Planning/evidence claims are updated only after review of successful gate output.

## Measured V1 artifact budgets

`docs/quality/V1_ARTIFACT_BUDGETS.json` is a reviewed baseline derived from measured V1 output. `pnpm release:check` only checks that baseline; it never silently creates or rewrites it. Any rebaseline is an explicit `pnpm v1:budgets:freeze` operation followed by review of the diff.

## Real OXS consumer

OXS validation is intentionally outside normal OXS-UI `verify` and `release:check` runs:

```bash
pnpm v1:oxs:check -- /path/to/OXS
```

The command requires a clean tracked OXS Git worktree, creates a detached temporary Git worktree from that exact OXS commit, overlays only `@ontologyx/ui` dependency declarations in the temporary worktree, installs the already-packed candidate, and runs OXS's canonical `pnpm verify`. It does not recursively copy the OXS workspace, so ignored build caches such as Servo/Cargo output never enter the isolation step. The original OXS tracked source tree is not modified.

Successful temporary worktrees are removed automatically. On failure, evidence is written under `artifacts/oxs-consumer-validation/` and the failing temporary worktree is preserved for diagnosis.

This is an explicit cross-repository release certification, not a hidden prerequisite of day-to-day UI verification.

## Stable publication

Registry publication is explicit after local release checks and whichever real-consumer certification is required for that release. The tagged release workflow verifies tag/package identity and publishes through npm Trusted Publishing; stable versions use `latest`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow must not publish a tag whose version differs from `packages/ui/package.json`. `scripts/check-release-tag.mjs` is the canonical identity check.

## Production Studio

`pnpm studio:build` generates the catalog, builds the Studio, and validates the static production artifact. `pnpm studio:preview` serves the built artifact locally. The Pages workflow deploys `apps/ui-studio/dist`; custom-domain/root deployments set the repository base-path variable rather than hard-coding routes in Studio source.
