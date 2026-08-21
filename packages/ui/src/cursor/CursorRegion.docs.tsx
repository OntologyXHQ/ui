import { CursorRegion, Stack, Text, UiRoot } from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'CursorRegion',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary:
      'Declares host-neutral cursor intent for a bounded interaction region while UiRoot owns theme, size, scale, hotspot and modality state.',
    usage:
      'Use semantic roles or a custom:<id> intent instead of feature-owned cursor CSS. The browser preview receives only a safe system-role fallback; native asset/theme installation remains host-owned.',
    status: 'accepted',
    accessibility:
      'Cursor intent is supplementary feedback only and never replaces role, name, focus, keyboard operation or other accessible interaction semantics.',
    rtl: 'Cursor roles are physical when the platform role itself is physical; compositions choose logical start/end intent before mapping to a concrete resize role.',
    touch:
      'UiRoot can suppress pointer presentation after touch/pen and nested roots retain independent cursor authority; touch interaction never depends on cursor visibility.',
    responsive:
      'Theme/nominal size/scale/hotspot are root-scoped host intent and remain independent from viewport-size adaptation.',
    playground: {
      preferredWidth: 'medium',
      fixture: { role: 'pointer', children: 'Pointer cursor region' },
    },
    examples: [
      {
        id: 'cursor-contract',
        title: 'Host-neutral cursor intent and nested modality',
        description:
          'Shows preserved custom host intent, browser fallback and a mouse-owned nested UiRoot escaping an outer touch-suppressed pointer preview.',
        component: 'CursorContractExample',
      },
    ],
  },
] as const);

export function CursorContractExample() {
  return (
    <UiRoot
      className="ui-doc-cursor-root ui-doc-cursor-root--outer"
      modality="touch"
      cursor={{
        theme: 'studio-host-theme',
        nominalSize: 32,
        scale: 1.5,
        hotspot: { x: 6, y: 8 },
        pointerRestoreDistance: 12,
      }}
    >
      <Stack gap="md" data-uir12-cursor-contract>
        <CursorRegion role="custom:precision-crosshair">
          <Text>Custom precision intent</Text>
        </CursorRegion>
        <UiRoot
          className="ui-doc-cursor-root ui-doc-cursor-root--inner"
          modality="mouse"
          cursor={{ theme: 'nested-host-theme', nominalSize: 24, scale: 1 }}
        >
          <CursorRegion role="pointer">
            <Text>Nested pointer region</Text>
          </CursorRegion>
        </UiRoot>
      </Stack>
    </UiRoot>
  );
}
