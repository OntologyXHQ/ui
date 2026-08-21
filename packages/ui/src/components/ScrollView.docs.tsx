import { Button, ScrollSnapItem, ScrollView, Stack, Surface, Text } from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'ScrollView',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary:
      'Logical scroll owner with native wheel chaining, direct manipulation, restoration, snapping, indicators and keyboard support.',
    usage:
      'Use where a reusable scroll owner is needed; give remounting views a stable restorationKey instead of storing browser-specific scrollLeft values.',
    status: 'accepted',
    accessibility:
      'The native viewport remains focusable when keyboard control is enabled, accepts an explicit accessible label and preserves descendant semantics.',
    rtl: 'Horizontal offset, keyboard movement, snapping and restoration use one logical inline coordinate independent of the browser RTL scrollLeft model and Document realm.',
    touch:
      'Touch and pen direct manipulation arbitrate through the shared gesture arena while wheel overflow can chain to nested OXS or native scroll owners.',
    responsive:
      'Viewport/content ResizeObserver reconciliation clamps stale offsets and recomputes variable-geometry snap targets without viewport or device branches.',
    examples: [
      {
        id: 'scroll-contract',
        title: 'Logical nested scroll, restoration and snap',
        description:
          'Exercises nested wheel ownership, remount restoration and variable-width start/center/end snap geometry.',
        component: 'ScrollViewContractExample',
      },
    ],
  },
  {
    exportName: 'ScrollSnapItem',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary:
      'Semantic child marker that contributes live start/center/end geometry to an owning ScrollView snap calculation.',
    usage:
      'Wrap snap destinations inside ScrollView; alignment is measured from live viewport-relative bounds so nested wrappers and variable item sizes remain valid.',
    status: 'accepted',
    accessibility:
      'Adds no role, focus stop or accessibility state; the wrapped content keeps its original semantics.',
    rtl: 'Start/end are logical alignments and horizontal item starts are derived from live RTL viewport geometry.',
    touch: 'Owns no gesture; ScrollView remains the sole direct-manipulation owner.',
    responsive:
      'Alignment uses current item and viewport bounds, so resizing and variable child geometry are remeasured before settlement.',
    examples: [
      {
        id: 'scroll-contract',
        title: 'Logical nested scroll, restoration and snap',
        component: 'ScrollViewContractExample',
      },
    ],
  },
] as const);

const restorationItems = Array.from({ length: 14 }, (_, index) => `Restoration row ${index + 1}`);
const nestedItems = Array.from({ length: 10 }, (_, index) => `Nested row ${index + 1}`);

export function ScrollViewContractExample() {
  const [mounted, setMounted] = useState(true);
  return (
    <Stack gap="lg" data-scroll-contract-example>
      <Button size="sm" onClick={() => setMounted((value) => !value)}>
        {mounted ? 'Unmount restorable scroll' : 'Mount restorable scroll'}
      </Button>
      {mounted ? (
        <ScrollView
          className="ui-doc-scroll-restorable"
          ariaLabel="Restorable scroll"
          restorationKey="docs-scroll-restoration"
        >
          <Stack gap="xs">
            {restorationItems.map((item) => (
              <Surface key={item} className="ui-doc-scroll-row" radius="sm">
                <Text>{item}</Text>
              </Surface>
            ))}
          </Stack>
        </ScrollView>
      ) : (
        <Text tone="tertiary">Restorable viewport is unmounted.</Text>
      )}

      <div className="ui-doc-native-scroll" data-native-scroll>
        <Text>Native ancestor start</Text>
        <ScrollView className="ui-doc-scroll-native-child" ariaLabel="Native-chain inner scroll">
          <Stack gap="xs">
            {nestedItems.map((item) => (
              <Surface key={`native-${item}`} className="ui-doc-scroll-row" radius="sm">
                <Text>{`Native ${item}`}</Text>
              </Surface>
            ))}
          </Stack>
        </ScrollView>
        <div className="ui-doc-native-scroll-tail">
          <Text>Native ancestor continuation</Text>
        </div>
      </div>

      <ScrollView className="ui-doc-scroll-outer" ariaLabel="Outer nested scroll">
        <Stack gap="sm">
          <Text>Outer start</Text>
          <ScrollView className="ui-doc-scroll-inner" ariaLabel="Inner nested scroll">
            <Stack gap="xs">
              {nestedItems.map((item) => (
                <Surface key={item} className="ui-doc-scroll-row" radius="sm">
                  <Text>{item}</Text>
                </Surface>
              ))}
            </Stack>
          </ScrollView>
          {nestedItems.slice(0, 5).map((item) => (
            <Surface key={`outer-${item}`} className="ui-doc-scroll-row" radius="sm">
              <Text>{`Outer ${item}`}</Text>
            </Surface>
          ))}
        </Stack>
      </ScrollView>

      <div className="ui-doc-scroll-resize-frame">
        <ScrollView
          axis="horizontal"
          snap="mandatory"
          overscroll="clamp"
          className="ui-doc-scroll-horizontal"
          ariaLabel="Logical snap strip"
        >
          <div className="ui-doc-scroll-snap-track">
            {(['start', 'center', 'end'] as const).map((align, index) => (
              <ScrollSnapItem
                key={align}
                align={align}
                className="ui-doc-scroll-snap-card"
                data-snap-card={align}
                data-size={index === 1 ? 'wide' : 'regular'}
              >
                <Surface radius="md">
                  <Text>{`${align} snap`}</Text>
                </Surface>
              </ScrollSnapItem>
            ))}
          </div>
        </ScrollView>
      </div>
    </Stack>
  );
}
