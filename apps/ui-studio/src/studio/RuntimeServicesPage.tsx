import {
  Button,
  CursorRegion,
  Grid,
  Heading,
  Label,
  Row,
  ScrollSnapItem,
  ScrollView,
  Stack,
  Surface,
  Text,
  TextField,
  UiRoot,
} from '@oxs/ui';
import {
  reorderItemsById,
  useCursorRuntime,
  useDragSource,
  useDropTarget,
  useEditableTextRuntime,
  useObservedElementSize,
  type EditableTextBridge,
} from '@oxs/ui/advanced';
import { useMemo, useRef, useState } from 'react';
import { StudioNav } from './StudioNav';

function ScrollProbe() {
  return (
    <Surface material="subtle" radius="lg" className="ui-runtime-card">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">Scroll service</Label>
          <Heading level={3} size="heading">Native ownership, shared observation</Heading>
          <Text tone="secondary">Drag with touch/pen, use keyboard, wheel, or snap through a single scroll contract.</Text>
        </Stack>
        <ScrollView axis="horizontal" snap="mandatory" indicator="always" ariaLabel="Runtime horizontal scroll demo" className="ui-runtime-horizontal-scroll">
          <Row gap="sm" className="ui-runtime-scroll-row">
            {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'].map((label) => (
              <ScrollSnapItem key={label} align="start">
                <Surface material="glass" radius="md" className="ui-runtime-scroll-tile">
                  <Text variant="body-strong">{label}</Text>
                </Surface>
              </ScrollSnapItem>
            ))}
          </Row>
        </ScrollView>
      </Stack>
    </Surface>
  );
}

function EditingProbe() {
  const runtime = useEditableTextRuntime();
  return (
    <Surface material="subtle" radius="lg" className="ui-runtime-card">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">Editing session</Label>
          <Heading level={3} size="heading">One backend-neutral text session</Heading>
          <Text tone="secondary">Focus, selection and composition publish through the shared editing runtime without exposing field-local DOM ownership.</Text>
        </Stack>
        <TextField label="Runtime field" defaultValue="Edit me" description="Select text or use IME composition to inspect the live session." />
        <Row gap="sm">
          <span className="ui-interaction-chip">{runtime.session ? 'active' : 'idle'}</span>
          <span className="ui-interaction-chip">{runtime.session?.state.contentPurpose ?? '—'}</span>
          <span className="ui-interaction-chip">selection {runtime.session ? `${runtime.session.state.selection.start}:${runtime.session.state.selection.end}` : '—'}</span>
        </Row>
      </Stack>
    </Surface>
  );
}

type DemoItem = { id: string; label: string };

function ReorderItem({ item, onDrop }: { item: DemoItem; onDrop: (sourceId: string, targetId: string) => void }) {
  const source = useDragSource({ id: item.id, item: { id: item.id, type: 'runtime-demo', label: item.label } });
  const target = useDropTarget({
    id: item.id,
    operation: 'move',
    accepts: (dragItem) => dragItem.type === 'runtime-demo' && dragItem.id !== item.id,
    onDrop: (dragItem) => onDrop(dragItem.id, item.id),
  });
  return (
    <Surface
      {...source}
      ref={target.ref}
      data-oxs-drop-active={target['data-oxs-drop-active']}
      material="glass"
      radius="md"
      className="ui-runtime-reorder-item"
    >
      <Row justify="between" align="center" gap="sm">
        <Text variant="body-strong">{item.label}</Text>
        <Label tone="tertiary">drag · Space</Label>
      </Row>
    </Surface>
  );
}

function DragDropProbe() {
  const [items, setItems] = useState<DemoItem[]>([
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
    { id: 'three', label: 'Three' },
    { id: 'four', label: 'Four' },
  ]);
  const move = (sourceId: string, targetId: string) => setItems((current) => reorderItemsById(current, sourceId, targetId, (item) => item.id));
  return (
    <Surface material="subtle" radius="lg" className="ui-runtime-card">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">Drag & drop</Label>
          <Heading level={3} size="heading">Pointer and keyboard reorder</Heading>
          <Text tone="secondary">Drag with a pointer, or press Space, navigate targets with arrows, then Enter/Space to drop.</Text>
        </Stack>
        <Stack gap="sm">{items.map((item) => <ReorderItem key={item.id} item={item} onDrop={move} />)}</Stack>
      </Stack>
    </Surface>
  );
}

function CursorProbe() {
  const cursor = useCursorRuntime();
  return (
    <Surface material="subtle" radius="lg" className="ui-runtime-card">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">Cursor semantics</Label>
          <Heading level={3} size="heading">Environment modality owns visibility</Heading>
          <Text tone="secondary">Cursor roles remain semantic while touch/mouse/pen modality comes from the shared environment.</Text>
        </Stack>
        <Row gap="sm">
          <span className="ui-interaction-chip">{cursor.modality}</span>
          <span className="ui-interaction-chip">{cursor.pointerVisible ? 'visible' : 'hidden'}</span>
        </Row>
        <Row gap="md" className="ui-runtime-cursor-row">
          <CursorRegion role="pointer"><Surface material="glass" radius="md" className="ui-runtime-cursor-swatch">pointer</Surface></CursorRegion>
          <CursorRegion role="text"><Surface material="glass" radius="md" className="ui-runtime-cursor-swatch">text</Surface></CursorRegion>
          <CursorRegion role="grab"><Surface material="glass" radius="md" className="ui-runtime-cursor-swatch">grab</Surface></CursorRegion>
        </Row>
      </Stack>
    </Surface>
  );
}

function ObservationProbe() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useObservedElementSize(ref);
  const [wide, setWide] = useState(false);
  return (
    <Surface material="subtle" radius="lg" className="ui-runtime-card">
      <Stack gap="md">
        <Row justify="between" align="center" gap="md">
          <Stack gap="2xs">
            <Label tone="accent" emphasis="strong">Observation</Label>
            <Heading level={3} size="heading">One pooled ResizeObserver</Heading>
          </Stack>
          <Button size="sm" onClick={() => setWide((value) => !value)}>Resize</Button>
        </Row>
        <div ref={ref} className="ui-runtime-observed" data-wide={wide ? 'true' : 'false'}>
          <Text variant="body-strong">{size ? `${Math.round(size.inlineSize)} × ${Math.round(size.blockSize)}` : 'measuring…'}</Text>
        </div>
      </Stack>
    </Surface>
  );
}

export function RuntimeServicesPage() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [modality, setModality] = useState<'mouse' | 'touch' | 'pen'>('mouse');
  const [bridgeEvents, setBridgeEvents] = useState(0);
  const editingBridge = useMemo<EditableTextBridge>(() => ({
    begin: () => setBridgeEvents((count) => count + 1),
    update: () => setBridgeEvents((count) => count + 1),
    end: () => setBridgeEvents((count) => count + 1),
  }), []);

  return (
    <UiRoot direction={direction} modality={modality} editingBridge={editingBridge}>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS UI runtime services workbench">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="runtime" />
            <section className="ui-runtime-hero">
              <Stack gap="md">
                <Row gap="sm"><Label tone="accent" emphasis="strong">UIP04</Label><Label tone="tertiary">Specialized runtime services</Label></Row>
                <Heading level={1} size="display">The last runtime spine before Primitives.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable>Scroll, editing, drag/drop, cursor semantics and geometry observation now share the same environment and ownership rules.</Text>
                <Row gap="sm" className="ui-runtime-toolbar">
                  <Button size="sm" variant={direction === 'ltr' ? 'filled' : 'ghost'} onClick={() => setDirection('ltr')}>LTR</Button>
                  <Button size="sm" variant={direction === 'rtl' ? 'filled' : 'ghost'} onClick={() => setDirection('rtl')}>RTL</Button>
                  {(['mouse', 'touch', 'pen'] as const).map((value) => <Button key={value} size="sm" variant={modality === value ? 'filled' : 'ghost'} onClick={() => setModality(value)}>{value}</Button>)}
                  <span className="ui-interaction-chip">bridge events {bridgeEvents}</span>
                </Row>
              </Stack>
            </section>
            <ScrollProbe />
            <Grid min="wide" gap="md"><EditingProbe /><CursorProbe /></Grid>
            <Grid min="wide" gap="md"><DragDropProbe /><ObservationProbe /></Grid>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}
