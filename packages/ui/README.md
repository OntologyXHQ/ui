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


## V2 semantic runtime (experimental)

The V2 surface adds a versioned, JSON-serializable semantic Author IR plus host-owned command, binding and source registries. Author IR describes intent and stable capability references; executable behavior and application values remain outside the IR. `resolveUiDefinition(...)` produces a bounded Runtime IR that canonical semantic bridge components can render through the accepted V1 component contracts.

```tsx
const settings = defineUi({
  id: 'settings.main',
  nodes: [
    ui.form({
      id: 'settings.appearance',
      title: 'Appearance',
      fields: [
        ui.choice({
          id: 'appearance',
          binding: 'settings.appearance',
          optionsSource: 'settings.appearance-options',
          label: 'Appearance',
          presentation: { preferred: 'segmented' },
        }),
      ],
    }),
  ],
});
```

The semantic contract is experimental until the V2 roadmap closes; V1 component APIs remain the compatibility foundation.

The optional icon vocabulary is a separate package subpath so the canonical entry stays lean:

```tsx
import { Icon } from '@ontologyx/ui';
import { HomeGlyph, PlaybackGlyph } from '@ontologyx/ui/icons';

<Icon glyph={HomeGlyph} />
<Icon glyph={PlaybackGlyph} state="pause" />
```

`@ontologyx/ui/icons` currently publishes 244 static semantic exports backed by 160 distinct glyph definitions plus 22 multi-state animated families. It has no third-party runtime icon dependency and uses the same `defineUiIcon` state/motion contract as custom glyphs.

## Package contract

- ESM only.
- React and React DOM are peer dependencies.
- Runtime dependencies: zero.
- Published files are restricted to `dist/`, this README, and LICENSE.
- `pnpm run build` emits JS, declarations, and one canonical CSS asset.
- `pnpm run pack:check` validates the publication artifact.

## Licensing

Released under the MIT License. See `LICENSE`.
