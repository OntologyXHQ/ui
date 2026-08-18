import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  useRef,
  useState } from 'react';
import {
  Button,
  Grid,
  Heading,
  Label,
  Menu,
  MenuItem,
  MotionTransition,
  Popover,
  Row,
  ScrollView,
  Stack,
  Surface,
  Text,
  UiRoot,
} from '@oxs/ui';
import {
  useMotionPolicy,
  usePanGesture,
  usePress,
  useRovingFocus,
} from '@oxs/ui/advanced';
import { StudioNav } from './StudioNav';

function PressProbe() {
  const [count, setCount] = useState(0);
  const [source, setSource] = useState('—');
  const press = usePress({
    onPress: (activation) => {
      setCount((value) => value + 1);
      setSource(activation.source);
    },
    onLongPress: (activation) => {
      setCount((value) => value + 1);
      setSource(`long-${activation.source}`);
    },
  });

  return (
    <Surface
      {...press.pressProps}
      role="button"
      tabIndex={0}
      className="ui-interaction-press-probe"
      material={press.pressed ? 'solid' : 'subtle'}
      radius="lg"
      data-pressed={press.pressed || undefined}
    >
      <Stack gap="xs">
        <Label tone="accent" emphasis="strong">Unified press</Label>
        <Heading level={3} size="heading">Mouse · touch · pen · keyboard</Heading>
        <Text tone="secondary">Press, hold for long-press, drag outside to cancel, or activate with Enter / Space.</Text>
        <Row gap="sm">
          <span className="ui-interaction-chip">count {count}</span>
          <span className="ui-interaction-chip">source {source}</span>
          <span className="ui-interaction-chip">{press.pressed ? 'pressed' : 'idle'}</span>
        </Row>
      </Stack>
    </Surface>
  );
}

function ArenaProbe() {
  const [status, setStatus] = useState('Tap or drag the pad');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const press = usePress({
    priority: 'default',
    onPress: () => setStatus('tap won the arena'),
    onPressChange: (pressed) => pressed && setStatus('tap candidate'),
  });
  const pan = usePanGesture({
    axis: 'free',
    priority: 'content',
    threshold: 8,
    onBegin: () => setStatus('pan claimed · tap cancelled'),
    onUpdate: (sample) => setOffset(sample.translation),
    onEnd: () => {
      setStatus('pan completed');
      setOffset({ x: 0, y: 0 });
    },
    onCancel: () => setOffset({ x: 0, y: 0 }),
  });

  const both = (
    key: 'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onLostPointerCapture',
  ) =>
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pressHandler = press.pressProps[key] as
        | ((event: ReactPointerEvent<HTMLElement>) => void)
        | undefined;
      const panHandler = pan.gestureProps[key] as
        | ((event: ReactPointerEvent<HTMLElement>) => void)
        | undefined;
      pressHandler?.(event);
      panHandler?.(event);
    };

  return (
    <Surface material="subtle" radius="lg" className="ui-interaction-card">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">One-owner arena</Label>
          <Heading level={3} size="heading">Tap and pan compete once</Heading>
          <Text tone="secondary">Cross the drag threshold and pan wins; otherwise tap owns activation.</Text>
        </Stack>
        <div
          className="ui-interaction-arena-pad"
          role="button"
          tabIndex={0}
          aria-label="Gesture arbitration pad"
          onPointerDown={both('onPointerDown')}
          onPointerMove={both('onPointerMove')}
          onPointerUp={both('onPointerUp')}
          onPointerCancel={both('onPointerCancel')}
          onLostPointerCapture={both('onLostPointerCapture')}
          onKeyDown={press.pressProps.onKeyDown}
          onKeyUp={press.pressProps.onKeyUp}
          onBlur={press.pressProps.onBlur}
        >
          <div
            className="ui-interaction-arena-orb"
            style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
          />
          <Text variant="body-strong">{status}</Text>
        </div>
      </Stack>
    </Surface>
  );
}

function RovingProbe({ direction }: { direction: 'ltr' | 'rtl' }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = useRovingFocus({
    containerRef: ref,
    itemSelector: 'button:not([disabled])',
    orientation: 'horizontal',
  });

  return (
    <UiRoot scope="nested" direction={direction}>
      <Surface material="subtle" radius="lg" className="ui-interaction-card">
        <Stack gap="md">
          <Stack gap="2xs">
            <Label tone="accent" emphasis="strong">Roving focus · {direction.toUpperCase()}</Label>
            <Heading level={3} size="heading">Logical arrow navigation</Heading>
            <Text tone="secondary">Focus one item and use ← / →. Direction reverses logically in RTL.</Text>
          </Stack>
          <div ref={ref} onKeyDown={onKeyDown}>
            <Row gap="sm" className="ui-interaction-roving-row">
              <Button size="sm">One</Button>
              <Button size="sm">Two</Button>
              <Button size="sm">Three</Button>
              <Button size="sm">Four</Button>
            </Row>
          </div>
        </Stack>
      </Surface>
    </UiRoot>
  );
}

function MotionProbe() {
  const [visible, setVisible] = useState(true);
  const policy = useMotionPolicy();
  return (
    <Surface material="subtle" radius="lg" className="ui-interaction-card">
      <Stack gap="md">
        <Row justify="between" gap="md">
          <Stack gap="2xs">
            <Label tone="accent" emphasis="strong">Motion policy</Label>
            <Heading level={3} size="heading">Interruptible, preference-aware</Heading>
          </Stack>
          <Button size="sm" onClick={() => setVisible((value) => !value)}>Toggle</Button>
        </Row>
        <Row gap="sm">
          <span className="ui-interaction-chip">{policy.preference}</span>
          <span className="ui-interaction-chip">{policy.targetFrameRate}Hz target</span>
          <span className="ui-interaction-chip">{policy.shouldAnimate ? 'animated' : 'instant'}</span>
        </Row>
        <div className="ui-interaction-motion-stage">
          <MotionTransition present={visible} kind="scale" spring="expressive">
            <div className="ui-interaction-motion-object">OXS</div>
          </MotionTransition>
        </div>
      </Stack>
    </Surface>
  );
}

function OverlayProbe() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const childRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Surface material="subtle" radius="lg" className="ui-interaction-card ui-interaction-overlay-demo">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">Overlay lifecycle</Label>
          <Heading level={3} size="heading">Topmost owns Escape and outside press</Heading>
          <Text tone="secondary">Open nested layers. Escape closes only the top layer and focus returns to its anchor.</Text>
        </Stack>
        <Row gap="sm" className="ui-interaction-overlay-actions">
          <Button ref={anchorRef} onClick={() => setParentOpen(true)}>Open parent</Button>
          <Button ref={menuRef} variant="soft" onClick={() => setMenuOpen(true)}>Open menu</Button>
        </Row>
        <Popover
          open={parentOpen}
          onOpenChange={setParentOpen}
          anchorRef={anchorRef}
          placement="bottom-start"
          ariaLabel="Parent interaction popover"
          autoFocus
        >
          <Stack gap="sm" className="ui-interaction-popover-content">
            <Label tone="accent">depth 1</Label>
            <Text>Parent overlay stays alive while its child owns dismissal.</Text>
            <Button ref={childRef} size="sm" onClick={() => setChildOpen(true)}>Open child</Button>
            <Popover
              open={childOpen}
              onOpenChange={setChildOpen}
              anchorRef={childRef}
              placement="inline-end"
              ariaLabel="Nested interaction popover"
              autoFocus
            >
              <Stack gap="xs" className="ui-interaction-popover-content">
                <Label tone="accent">depth 2</Label>
                <Text>Escape closes me first.</Text>
                <Button size="sm" onClick={() => setChildOpen(false)}>Close child</Button>
              </Stack>
            </Popover>
          </Stack>
        </Popover>
        <Menu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          anchorRef={menuRef}
          placement="bottom-end"
          ariaLabel="Interaction navigation menu"
        >
          <MenuItem onSelect={() => setMenuOpen(false)}>First action</MenuItem>
          <MenuItem onSelect={() => setMenuOpen(false)}>Second action</MenuItem>
          <MenuItem disabled>Disabled action</MenuItem>
        </Menu>
      </Stack>
    </Surface>
  );
}

export function InteractionKernelPage() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [motion, setMotion] = useState<'full' | 'reduced'>('full');

  return (
    <UiRoot direction={direction} motion={motion}>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS UI interaction kernel playground">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="interaction" />
            <section className="ui-interaction-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP03</Label>
                  <Label tone="tertiary">Shared interaction kernel</Label>
                </Row>
                <Heading level={1} size="display">One behavioral spine for every component.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable>
                  Press, focus, gesture arbitration, motion policy, overlay ownership and floating geometry now share one reusable contract instead of being reimplemented inside controls.
                </Text>
                <Row gap="sm" className="ui-interaction-toolbar">
                  <Button size="sm" variant={direction === 'ltr' ? 'filled' : 'ghost'} onClick={() => setDirection('ltr')}>LTR</Button>
                  <Button size="sm" variant={direction === 'rtl' ? 'filled' : 'ghost'} onClick={() => setDirection('rtl')}>RTL</Button>
                  <Button size="sm" variant={motion === 'full' ? 'filled' : 'ghost'} onClick={() => setMotion('full')}>Full motion</Button>
                  <Button size="sm" variant={motion === 'reduced' ? 'filled' : 'ghost'} onClick={() => setMotion('reduced')}>Reduced motion</Button>
                </Row>
              </Stack>
            </section>

            <PressProbe />
            <Grid min="wide" gap="md">
              <ArenaProbe />
              <MotionProbe />
            </Grid>
            <Grid min="wide" gap="md">
              <RovingProbe direction="ltr" />
              <RovingProbe direction="rtl" />
            </Grid>
            <OverlayProbe />

            <Surface material="glass" elevation={1} radius="xl" className="ui-interaction-contract">
              <Grid min="wide" gap="md">
                {[
                  ['Press', 'Pointer capture, cancel-on-drag, keyboard parity and gesture-arena participation.'],
                  ['Focus', 'Logical roving navigation, Home/End, focus trap and restoration.'],
                  ['Gestures', 'A single winner per pointer stream; higher-priority owners cancel losing candidates.'],
                  ['Motion', 'One runtime clock with interruption and reduced-motion policy.'],
                  ['Overlays', 'Topmost dismissal ownership, nesting, modal isolation and focus restoration.'],
                  ['Floating', 'Logical start/end placement, collision flip/shift and resize/scroll observation.'],
                ].map(([title, body]) => (
                  <Surface key={title} material="subtle" radius="md" className="ui-interaction-contract__item">
                    <Stack gap="xs"><Label tone="accent">{title}</Label><Text tone="secondary">{body}</Text></Stack>
                  </Surface>
                ))}
              </Grid>
            </Surface>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}
