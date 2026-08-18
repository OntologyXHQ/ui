# @ontologyx/ui

Production UI package extracted from the OXS product repository. It owns Foundations → Primitives → Components → System UI plus runtime-neutral interaction contracts.

## Install

```bash
pnpm add @ontologyx/ui react react-dom
```

```tsx
import { Button, Stack, UiRoot } from '@ontologyx/ui';

export function Example() {
  return <UiRoot><Stack><Button>Continue</Button></Stack></UiRoot>;
}
```

Published JavaScript entries are stylesheet-neutral so Node, SSR, test runners, and other non-CSS hosts can import `@ontologyx/ui` safely. Browser/application hosts must import `@ontologyx/ui/styles.css` once at their composition entry. Advanced infrastructure intended for diagnostics/platform integration is available from `@ontologyx/ui/advanced`.

## Package contract

- ESM only.
- React and React DOM are peer dependencies.
- Runtime dependencies: zero.
- Published files are restricted to `dist/`, this README, and LICENSE.
- `pnpm run build` emits JS, declarations, and one canonical CSS asset.
- `pnpm run pack:check` validates the publication artifact.

## Licensing

Released under the MIT License. See `LICENSE`.
