import { useState } from 'react';
import { Button, Code, defineUiIcon, Icon, Row, Stack, Text, Wrap } from '@ontologyx/ui';
import {
  ANIMATED_ICON_FAMILY_COUNT,
  STATIC_ICON_PACK_COUNT,
  ActivityStateGlyph,
  BookmarkGlyph,
  CartGlyph,
  CodeGlyph,
  ConnectivityStateGlyph,
  FavoriteStateGlyph,
  FolderGlyph,
  HomeGlyph,
  LockStateGlyph,
  MailGlyph,
  MapPinGlyph,
  PlaybackGlyph,
  RocketGlyph,
  SearchGlyph,
  SettingsGlyph,
  ShieldGlyph,
  SparklesGlyph,
  ThemeStateGlyph,
  WifiGlyph,
} from '@ontologyx/ui/icons';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Icon',
    layer: 'primitives',
    category: 'Iconography',
    order: 40,
    status: 'accepted',
    summary: 'Current-color SVG icon primitive with immutable multi-state glyph families and explicit transient transition states.',
    usage:
      'Use built-in semantic glyph families, `defineUiIcon`, or the optional tree-shakeable `@ontologyx/ui/icons` pack. For stateful glyphs change only the stable `state`; Icon owns the visual transition phase, interruption/retargeting and reduced-motion settlement. Icons never own action semantics.',
    accessibility:
      'Decorative by default and permanently unfocusable. Pass `label` only when the standalone glyph itself conveys meaning; role/aria-hidden wiring is owned by Icon.',
    rtl: 'Directional families declare semantic mirroring once; `mirror="auto"` follows the Icon element’s resolved local direction, including nested RTL/LTR subtrees, without separate left/right glyph APIs.',
    touch: 'Never becomes a pointer/touch target by itself; Button/IconButton and other Components own hit targets.',
    responsive: 'Finite sizes preserve the shared viewBox/currentColor contract; state transitions do not change layout geometry.',
    examples: [
      {
        id: 'state-transition',
        title: 'Stable → transient → stable',
        description: 'Playback publishes play/pause stable states and pausing/playing transient states; reduced motion settles through the same contract without visual motion.',
        component: 'IconStateTransitionExample',
      },
      {
        id: 'static-extension',
        title: 'Static custom + local-direction glyphs',
        description: 'Static path shorthand remains available, while directional glyphs mirror from their own nested direction rather than assuming the root direction.',
        component: 'IconStaticContractExample',
      },
      {
        id: 'icon-pack',
        title: 'Optional static + animated icon pack',
        description: 'The separate @ontologyx/ui/icons entry provides a broad static vocabulary and stateful animated families without forcing the pack into the main @ontologyx/ui entry.',
        component: 'IconPackExample',
      },
    ],
  },
] as const);

const customSpark = defineUiIcon({
  paths: ['m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z'],
});

export function IconStateTransitionExample() {
  const [state, setState] = useState<'play' | 'pause'>('play');
  return (
    <Stack gap="sm">
      <Row gap="md" align="center">
        <Icon
          name="playback"
          state={state}
          size="xl"
          label="Playback state icon"
          data-visual-cert="stateful-icon"
        />
        <Stack gap="2xs">
          <Text variant="body-strong">Stable target: <Code>{state}</Code></Text>
          <Text tone="tertiary">The transient visual state belongs to Icon, not feature CSS.</Text>
        </Stack>
      </Row>
      <Button
        size="sm"
        variant="soft"
        onClick={() => setState((current) => (current === 'play' ? 'pause' : 'play'))}
      >
        Toggle playback icon
      </Button>
    </Stack>
  );
}

export function IconStaticContractExample() {
  return (
    <Stack gap="sm">
      <Row gap="md" dir="rtl" aria-label="Nested RTL directional icon contract">
        <Icon name="chevron-start" label="Start direction" data-visual-cert="rtl-icon" />
        <Icon name="chevron-end" label="End direction" />
      </Row>
      <Row gap="md" dir="ltr" aria-label="Nested LTR directional icon contract">
        <Icon name="chevron-start" label="LTR start direction" data-visual-cert="ltr-icon" />
      </Row>
      <Icon glyph={customSpark} label="Custom spark icon" data-visual-cert="custom-icon" />
    </Stack>
  );
}

const staticPackSamples = [
  ['Home', HomeGlyph],
  ['Search', SearchGlyph],
  ['Settings', SettingsGlyph],
  ['Mail', MailGlyph],
  ['Folder', FolderGlyph],
  ['Shield', ShieldGlyph],
  ['Wi-Fi', WifiGlyph],
  ['Cart', CartGlyph],
  ['Map pin', MapPinGlyph],
  ['Code', CodeGlyph],
  ['Bookmark', BookmarkGlyph],
  ['Rocket', RocketGlyph],
  ['Sparkles', SparklesGlyph],
] as const;

export function IconPackExample() {
  const [active, setActive] = useState(false);
  return (
    <Stack gap="md" data-visual-cert="icon-pack">
      <Text variant="body-strong">
        <Code>{STATIC_ICON_PACK_COUNT}</Code> static exports · <Code>{ANIMATED_ICON_FAMILY_COUNT}</Code> animated state families
      </Text>
      <Wrap gap="sm" aria-label="Representative static icon pack">
        {staticPackSamples.map(([label, glyph]) => (
          <Row key={label} gap="2xs" align="center" data-icon-pack-static="true">
            <Icon glyph={glyph} />
            <Text variant="caption">{label}</Text>
          </Row>
        ))}
      </Wrap>
      <Row gap="lg" align="center" aria-label="Representative animated icon families">
        <Icon glyph={PlaybackGlyph} state={active ? 'pause' : 'play'} label="Playback" data-icon-pack-animated="playback" />
        <Icon glyph={FavoriteStateGlyph} state={active ? 'on' : 'off'} label="Favorite" data-icon-pack-animated="favorite" />
        <Icon glyph={LockStateGlyph} state={active ? 'unlocked' : 'locked'} label="Lock" data-icon-pack-animated="lock" />
        <Icon glyph={ConnectivityStateGlyph} state={active ? 'online' : 'offline'} label="Connectivity" data-icon-pack-animated="connectivity" />
        <Icon glyph={ThemeStateGlyph} state={active ? 'dark' : 'light'} label="Theme" data-icon-pack-animated="theme" />
        <Icon glyph={ActivityStateGlyph} state={active ? 'active' : 'idle'} label="Activity" data-icon-pack-animated="activity" />
      </Row>
      <Button size="sm" variant="soft" onClick={() => setActive((current) => !current)}>
        Toggle animated icon pack
      </Button>
    </Stack>
  );
}
