# UIR16 Studio Product Workbench Audit

UIR16 closes the Studio as a real consumer/workbench for the public `@ontologyx/ui` SDK. It does not add product authority or a second visual implementation.

## UI-1601 — information architecture

- Catalog navigation remains source-derived and grouped by Foundation / Primitive / Component / System layer and source-owned category order.
- Search plus explicit layer and lifecycle-status filters are public `SearchField`/`Select` Components.
- `q`, `layer`, and `status` are URL state, so filtered catalog views survive reload and can be shared.
- Lifecycle badges remain visible per entry; the filter vocabulary includes accepted/candidate/experimental/deprecated even when V1 currently contains only accepted exports.

## UI-1602 — dedicated real previews

- The primary preview renders the actual public export directly whenever required props can be seeded from static docs fixtures, documented defaults, literal unions, scalar values, ReactNode copy, or callbacks.
- Complex trigger-owned exports may not silently reuse the first family/example demo. They must declare an explicit source-owned `preview` component.
- ContextMenu and Tooltip now declare dedicated preview components; the Studio publishes `data-studio-preview-mode="direct|dedicated"` for evidence.
- The permanent Studio workbench gate rejects accepted exports that are neither directly seedable nor explicitly previewed.

## UI-1603 — generated API and state ownership

- Every accepted public prop must have generated JSDoc/description; missing accepted prop documentation is a blocking Studio gate.
- The API table keeps the extracted source/default value column. An em dash means no SDK default was declared by source metadata.
- Controlled state pairs are generated from the actual public prop surface (`value/onValueChange`, `checked/onCheckedChange`, `open/onOpenChange`, etc.). Where a matching `default*` prop exists, Studio explicitly documents controlled-or-uncontrolled ownership; otherwise it documents caller-controlled ownership.

## UI-1604 — acceptance evidence

- Acceptance cards use `docs/quality/CERTIFICATIONS.json`, not inferred documentation coverage.
- Generated certification data carries the roadmap owner, concrete behavior-test source paths, G6 scenario ids/source, required axes, and explicit `certified` result.
- Studio renders source links to the repository-owned G5 test files and G6 scenario source.

## UI-1605 — environment control plane

- Environment controls stay on their own stable nested `UiRoot` so preview RTL/density cannot make the workbench controls unreachable.
- All controls are public `Toolbar`/`Select` Components and adapt through existing container queries; no reusable raw button/input/select/textarea implementation is added.
- Existing G6 interaction proves direction/density changes remain reachable while the stable control plane stays LTR/comfortable.

## UI-1606 — search, deep links and error isolation

- Entry, section, example, state, search query, layer and lifecycle status all round-trip through URL state.
- Per-entry detail errors remain isolated, and `CatalogErrorBoundary` resets when navigation moves to a different entry instead of trapping the whole Studio in a stale error state.

## UI-1607 — one visual implementation

- `scripts/gates/check-studio.py` continues to reject unreachable Studio TS/TSX, raw reusable controls, source/deep imports, host/product internals and unreviewed external dependencies.
- Studio typography/layout/control surfaces continue to compose public `@ontologyx/ui`; local CSS only arranges the workbench host.
- The UIR16 gate additionally rejects implicit family-example preview fallback.

## UI-1608 — browser certification

`studio-route-environment-a11y` now additionally proves:

- source-linked certification result/evidence;
- shareable query/layer/status state survives reload;
- complex ContextMenu uses an explicit dedicated preview;
- SystemApplicationBrowser renders a caller-supplied image resource while the example states that Host/App Registry owns discovery, icon resolution and launch authority;
- the generated workbench remains axe-clean after those real navigation states.

## Host-owned application icons

The System UI contract deliberately accepts application presentation data; it does not discover installed apps or resolve icon themes/filesystems. The Studio example supplies a host-resolved `{ src }` icon resource and keeps launch activation as a stable-id callback:

```text
OXS App/Package Registry
  -> resolves installed application metadata + icon resource
  -> SystemApplicationBrowser receives { id, name, icon }
  -> @ontologyx/ui renders only
  -> onActivate(id)
  -> OXS retains launch authority
```

This boundary is evidence/documentation only; UIR16 does not move package-manager, filesystem, `.desktop`, icon-theme or process-launch authority into React.

## Closeout

`pnpm uir16:closeout` runs catalog generation, the dedicated Studio workbench gate, canonical `pnpm verify`, and production Studio artifact inspection. Planning advances only after all pass. Validation failure preserves the applied/generated/formatted state for fix-forward debugging; there is no source rollback.
