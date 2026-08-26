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

`pnpm verify` is the canonical G0..G6 repository acceptance. It is non-mutating, performs one production build, and then runs the real-browser suite against that build. Formatting remains an explicit mutating maintenance step before verification when source was edited. `pnpm lint` remains an explicit cleanup gate until its existing rule debt is resolved deliberately.

`pnpm release:check` extends the same verified state with the G7 artifact checks: production Studio inspection, deterministic `@ontologyx/ui` tarball creation, a fresh generic packed-tarball consumer smoke, the reviewed V1 artifact budgets, and the V1 freeze contract. It does **not** format source, regenerate documentation, rewrite roadmap/task files, clone OXS, or freeze/rebaseline budgets.

Mutating maintenance is explicit:

```bash
pnpm format             # formatter only
pnpm lint               # explicit repo-wide Biome lint/debt audit
pnpm catalog:generate   # regenerate checked-in catalog output
pnpm v1:budgets:freeze      # initial freeze only; refuses to overwrite an existing baseline
pnpm v1:budgets:rebaseline  # UIR17 final measured-output rebaseline; explicit release-review operation
```

## Measured V1 artifact budgets

`docs/quality/V1_ARTIFACT_BUDGETS.json` is a reviewed baseline derived from measured V1 output. `pnpm release:check` only checks that baseline; it never silently creates or rewrites it. The UIR17 final freeze is an explicit `pnpm v1:budgets:rebaseline` operation performed only after the verified package/Studio/tarball exist; later rebaselines require a new explicit release review. Normal `pnpm release:check` never rewrites budgets.

## Real OXS consumer

OXS validation is intentionally outside normal OXS-UI `verify` and `release:check` runs:

```bash
pnpm v1:oxs:check -- /path/to/OXS
```

The validator creates a detached temporary Git worktree from the concrete OXS `HEAD`, then overlays the caller's current **tracked changes plus untracked non-ignored files** without copying ignored build/cache output. It first installs the untouched dependency baseline and runs the **baseline OXS-owned root gate** (`pnpm quality` in the post-UI-split repository, with legacy `pnpm verify` support where applicable). Only after that baseline passes does it inject the already-packed `@ontologyx/ui` candidate into the isolated manifests, reinstall, and run each direct candidate consumer package `check`/`build` script. This preserves OXS policy/pinning authority while proving the release candidate against the user's actual current consumer state. The original OXS worktree is never modified.

Successful temporary worktrees are removed automatically. On failure, evidence is written under `artifacts/oxs-consumer-validation/` and the failing temporary worktree is preserved for diagnosis. Offline install is attempted first; a network fallback is allowed only when pnpm reports a missing local tarball.

This is an explicit cross-repository release certification, not a hidden prerequisite of day-to-day UI verification.


## Historical V1 closeout

The numbered UIR closeout commands were development-era planning helpers and are no longer part of the active workspace command surface. Their audit documents remain historical evidence. Current release proof uses the generic `pnpm verify`, `pnpm release:check`, explicit real-OXS validation when required, and the tagged trusted-publishing workflow.

## Stable publication

Registry publication is explicit after local release checks and whichever real-consumer certification is required for that release. The tagged release workflow verifies tag/package identity and publishes through npm Trusted Publishing; stable versions use `latest`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow must not publish a tag whose version differs from `packages/ui/package.json`. `scripts/check-release-tag.mjs` is the canonical identity check.

## Production Studio

`pnpm studio:build` generates the catalog, builds the Studio, and validates the static production artifact. `pnpm studio:preview` serves the built artifact locally. The Pages workflow deploys `apps/ui-studio/dist`; custom-domain/root deployments set the repository base-path variable rather than hard-coding routes in Studio source.
