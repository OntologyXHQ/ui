import type { ReactNode } from 'react';
import type { PrimitiveSvgProps } from './PrimitiveProps';

export type IconName =
  | 'apps'
  | 'browser'
  | 'chevron-end'
  | 'chevron-start'
  | 'check'
  | 'close'
  | 'editor'
  | 'files'
  | 'music'
  | 'photos'
  | 'search'
  | 'settings'
  | 'software'
  | 'terminal';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconMirror = 'auto' | 'always' | 'never';

export type UiIconDefinition = Readonly<{
  paths: readonly string[];
  viewBox?: string;
  mirrorInRtl?: boolean;
}>;

export function defineUiIcon(definition: UiIconDefinition): UiIconDefinition {
  if (!definition.paths.length) throw new Error('defineUiIcon requires at least one SVG path.');
  return Object.freeze({
    viewBox: definition.viewBox ?? '0 0 24 24',
    mirrorInRtl: definition.mirrorInRtl ?? false,
    paths: Object.freeze([...definition.paths]),
  });
}

const ICONS: Readonly<Record<IconName, UiIconDefinition>> = {
  apps: defineUiIcon({ paths: ['M5 5h5v5H5zm9 0h5v5h-5zM5 14h5v5H5zm9 0h5v5h-5z'] }),
  browser: defineUiIcon({ paths: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M4 12h16', 'M12 4c3 3.5 3 12.5 0 16', 'M12 4c-3 3.5-3 12.5 0 16'] }),
  'chevron-end': defineUiIcon({ paths: ['m9 6 6 6-6 6'], mirrorInRtl: true }),
  'chevron-start': defineUiIcon({ paths: ['m15 6-6 6 6 6'], mirrorInRtl: true }),
  check: defineUiIcon({ paths: ['m5 12.5 4.2 4.2L19 7'] }),
  close: defineUiIcon({ paths: ['m7 7 10 10M17 7 7 17'] }),
  editor: defineUiIcon({ paths: ['m9 6-4 6 4 6M15 6l4 6-4 6M13.5 5 10.5 19'] }),
  files: defineUiIcon({ paths: ['M4 7.5h6l1.6 2H20v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16'] }),
  music: defineUiIcon({ paths: ['M9 18V7l9-2v11M9 18a2.5 2.5 0 1 1-2.5-2.5H9zm9-2a2.5 2.5 0 1 1-2.5-2.5H18'] }),
  photos: defineUiIcon({ paths: ['M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'M7.5 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z', 'm6.5 17 4-4 2.6 2.6 1.8-1.8 2.6 3.2'] }),
  search: defineUiIcon({ paths: ['m17.5 17.5-3.4-3.4', 'M15.5 10.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z'] }),
  settings: defineUiIcon({ paths: ['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z', 'M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18'] }),
  software: defineUiIcon({ paths: ['m12 3 8 4.5v9L12 21l-8-4.5v-9zm0 0v9m8-4.5-8 4.5-8-4.5M12 12v9'] }),
  terminal: defineUiIcon({ paths: ['m5 7 4 4-4 4M11 16h7'] }),
};

type IconSource =
  | { name: IconName; glyph?: never }
  | { name?: never; glyph: UiIconDefinition };

export type IconProps = PrimitiveSvgProps &
  IconSource & {
    size?: IconSize;
    label?: string;
    animated?: boolean;
    mirror?: IconMirror;
  };

function iconPaths(glyph: UiIconDefinition): ReactNode {
  return glyph.paths.map((path) => <path key={path} d={path} />);
}

export function Icon({
  name,
  glyph: customGlyph,
  size = 'md',
  label,
  animated = false,
  mirror = 'auto',
  className = '',
  ...props
}: IconProps) {
  const glyph = customGlyph ?? ICONS[name as IconName];
  const shouldMirror = mirror === 'always' || (mirror === 'auto' && glyph.mirrorInRtl);

  return (
    <svg
      className={[
        'ui-icon',
        `ui-icon--${size}`,
        animated ? 'ui-icon--animated' : '',
        shouldMirror ? 'ui-icon--mirror-rtl' : '',
        mirror === 'always' ? 'ui-icon--mirror-always' : '',
        className,
      ].filter(Boolean).join(' ')}
      viewBox={glyph.viewBox ?? '0 0 24 24'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
    >
      {iconPaths(glyph)}
    </svg>
  );
}
