import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRoot } from '../../adaptive';
import { Icon } from '../../primitives';
import * as AnimatedIcons from '../animated';
import {
  ANIMATED_ICON_FAMILY_COUNT,
  ActivityStateGlyph,
  PlaybackGlyph,
  VolumeStateGlyph,
} from '../animated';
import * as StaticIcons from '../static';
import { ChevronStartGlyph, HomeGlyph, OxMarkGlyph, STATIC_ICON_PACK_COUNT } from '../static';

describe('optional OntologyX icon pack', () => {
  it('keeps the declared static and animated breadth machine-checkable', () => {
    const staticGlyphExports = Object.keys(StaticIcons).filter((name) => name.endsWith('Glyph'));
    const animatedGlyphExports = Object.keys(AnimatedIcons).filter((name) =>
      name.endsWith('Glyph'),
    );

    expect(staticGlyphExports).toHaveLength(STATIC_ICON_PACK_COUNT);
    expect(animatedGlyphExports).toHaveLength(ANIMATED_ICON_FAMILY_COUNT);
    expect(STATIC_ICON_PACK_COUNT).toBeGreaterThanOrEqual(240);
    expect(ANIMATED_ICON_FAMILY_COUNT).toBeGreaterThanOrEqual(20);
  });

  it('renders static and stateful pack glyphs through the one public Icon contract', () => {
    render(
      <UiRoot direction="rtl">
        <Icon glyph={HomeGlyph} label="Home pack glyph" />
        <Icon glyph={OxMarkGlyph} label="OntologyX mark glyph" />
        <Icon glyph={ChevronStartGlyph} label="Directional pack glyph" />
        <Icon glyph={PlaybackGlyph} state="pause" label="Playback pack glyph" />
        <Icon glyph={ActivityStateGlyph} state="active" label="Activity pack glyph" />
      </UiRoot>,
    );

    expect(screen.getByRole('img', { name: 'Home pack glyph' })).toHaveAttribute(
      'data-oxs-icon-state',
      'default',
    );
    expect(screen.getByRole('img', { name: 'OntologyX mark glyph' })).toHaveAttribute(
      'data-oxs-icon-state',
      'default',
    );
    expect(screen.getByRole('img', { name: 'Directional pack glyph' })).toHaveClass(
      'ui-icon--mirror-rtl',
    );
    expect(screen.getByRole('img', { name: 'Playback pack glyph' })).toHaveAttribute(
      'data-oxs-icon-state',
      'pause',
    );
    expect(screen.getByRole('img', { name: 'Activity pack glyph' })).toHaveAttribute(
      'data-oxs-icon-state',
      'active',
    );
  });

  it('preserves state-family typing at the optional subpath boundary', () => {
    if (false) {
      <Icon glyph={PlaybackGlyph} state="play" />;
      <Icon glyph={VolumeStateGlyph} state="muted" />;
      // @ts-expect-error PlaybackGlyph only accepts play/pause stable states.
      <Icon glyph={PlaybackGlyph} state="muted" />;
      // @ts-expect-error VolumeStateGlyph does not expose playback states.
      <Icon glyph={VolumeStateGlyph} state="pause" />;
    }
    expect(true).toBe(true);
  });
});
