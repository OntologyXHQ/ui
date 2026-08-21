import { Button, Code, GestureRevealHandle, Stack, Text, useDragReveal, Wrap } from '@ontologyx/ui';
import { useDragSource, useDropTarget, usePanGesture } from '@ontologyx/ui/advanced';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'GestureRevealHandle',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary:
      'Accessible reveal handle backed by the shared gesture arena, with pointer cancellation and keyboard activation kept on one control.',
    usage:
      'Bind gestureProps and activate from useDragReveal; keep product/System placement and open-state policy outside the Component.',
    status: 'accepted',
    accessibility:
      'The handle is one real button with visible focus, aria-expanded state and keyboard activation; direct manipulation supplements rather than replaces activation.',
    rtl: 'Reveal displacement is supplied by the owning composition; semantic start/end and physical system-edge gestures remain distinct contracts.',
    touch:
      'Pan/reveal arbitration uses the shared Gesture Arena. Unclaimed pointer streams remain available to native scrolling/text selection and touch drag yields to native movement before long-press ownership.',
    responsive:
      'Gesture and drag coordinates stay in the owning Window realm; pointer previews are projected into the owning portal host and edge auto-scroll follows live container geometry.',
    examples: [
      {
        id: 'interaction-runtime',
        title: 'Gesture and drag/drop ownership',
        description:
          'Exercises reveal arbitration, threshold ownership, keyboard/pointer drag, portal preview and stationary edge auto-scroll without moving native host authority into the Component.',
        component: 'GestureRuntimeContractExample',
      },
    ],
  },
] as const);

export function GestureRuntimeContractExample() {
  const [open, setOpen] = useState(false);
  const [panState, setPanState] = useState('native');
  const [dropResult, setDropResult] = useState('none');
  const reveal = useDragReveal({
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    distance: 96,
  });
  const pan = usePanGesture({
    axis: 'x',
    threshold: 10,
    onBegin: () => setPanState('claimed'),
    onUpdate: () => setPanState('claimed'),
    onEnd: () => setPanState('ended'),
    onCancel: () => setPanState('cancelled'),
  });
  const dragSource = useDragSource({
    id: 'studio-drag-source',
    item: { id: 'studio-card', type: 'document', label: 'Studio card' },
    preview: <span data-dnd-preview-content>Dragging Studio card</span>,
    threshold: 4,
  });
  const dropTarget = useDropTarget({
    id: 'studio-drop-target',
    label: 'Studio drop target',
    operation: 'move',
    onDrop: (item, operation) => setDropResult(`${item.id}:${operation}`),
  });

  return (
    <Stack gap="md" data-uir12-interaction-runtime>
      <GestureRevealHandle
        gestureProps={reveal.gestureProps}
        onActivate={reveal.activate}
        expanded={open}
        ariaLabel="Runtime reveal handle"
        label={open ? 'Hide contract panel' : 'Reveal contract panel'}
      />
      <Code data-reveal-state>{open ? 'open' : 'closed'}</Code>

      <div
        className="ui-doc-pan-competition"
        data-pan-competition
        {...pan.gestureProps}
        onPointerDown={(event) => {
          setPanState('native');
          pan.gestureProps.onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          pan.gestureProps.onPointerMove?.(event);
          if (!event.defaultPrevented) setPanState('native');
        }}
      >
        Native selectable text remains uncancelled below the pan threshold and becomes arena-owned
        only after a deliberate horizontal gesture.
      </div>
      <Code data-pan-state>{panState}</Code>

      <div className="ui-doc-dnd-scroll" data-dnd-scroll>
        <div className="ui-doc-dnd-scroll-content">
          <Wrap gap="sm" className="ui-doc-drag-row">
            <Button className="ui-doc-drag-source" {...dragSource}>
              Drag Studio card
            </Button>
            <Button className="ui-doc-drop-target" variant="secondary" {...dropTarget}>
              Drop Studio card here
            </Button>
          </Wrap>
          <Text tone="secondary">
            Keep the pointer near the lower edge while dragging to certify stationary edge
            auto-scroll.
          </Text>
          <div className="ui-doc-dnd-scroll-spacer" aria-hidden />
        </div>
      </div>
      <Code data-drop-result>{dropResult}</Code>
    </Stack>
  );
}
