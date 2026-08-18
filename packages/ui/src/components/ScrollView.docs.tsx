import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { ScrollView, Stack, Surface, Text } from '@ontologyx/ui';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'ScrollView',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary:
      'Reusable scroll owner with inertia, overscroll, snapping, indicators and keyboard support.',
    usage:
      'Use where OXS scroll behavior is required instead of feature-owned overflow/gesture engines.',
    status: 'candidate',
    accessibility: 'Focusable keyboard scrolling can be enabled and labelled.',
    rtl: 'Horizontal motion is normalized to a logical inline position before drag, keyboard, momentum, indicator and snap calculations, insulating callers from browser RTL scrollLeft models.',
    touch:
      'Direct pointer/touch scrolling is first-class and competes through shared gesture ownership.',
    responsive: 'Scroll viewport observes its actual container.',
    examples: [
      {
        id: 'overview',
        title: 'Overview',
        description: 'Representative current states rendered from the colocated docs module.',
        component: 'ScrollViewExample',
      },
    ],
  },
  {
    exportName: 'ScrollSnapItem',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Child marker that contributes real start/center/end snap alignment to ScrollView.',
    usage: 'Use only as a direct/owned ScrollView child when snap behavior is needed.',
    status: 'candidate',
    accessibility: 'Does not alter child accessibility semantics.',
    rtl: 'Start/end snap alignment is interpreted logically by the scroll service.',
    touch: 'Does not own touch input independently of ScrollView.',
    responsive: 'Start/center/end offsets derive from real item and viewport geometry, then clamp through the shared scroll service.',
  },
] as const);

const scrollViewExampleItems = [
  'Scrollable item 1',
  'Scrollable item 2',
  'Scrollable item 3',
  'Scrollable item 4',
  'Scrollable item 5',
  'Scrollable item 6',
  'Scrollable item 7',
  'Scrollable item 8',
] as const;

export function ScrollViewExample() {
  return (
    <ScrollView className="ui-doc-example-scroll" ariaLabel="Catalog scroll example">
      <Stack gap="sm">
        {scrollViewExampleItems.map((item) => (
          <Surface key={item} className="ui-doc-example-scroll-item" radius="md">
            <Text>{item}</Text>
          </Surface>
        ))}
      </Stack>
    </ScrollView>
  );
}
