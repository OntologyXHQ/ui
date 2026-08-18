import {
  AlertDialog,
  Banner,
  BottomSheet,
  Button,
  ContextMenu,
  Dialog,
  Grid,
  Heading,
  Label,
  Menu,
  MenuItem,
  Popover,
  Row,
  ScrollView,
  Sheet,
  Stack,
  Surface,
  Text,
  ToastHost,
  Tooltip,
  UiRoot,
  useToastQueue,
} from '@ontologyx/ui';
import { useRef, useState } from 'react';
import { StudioNav } from './StudioNav';

export function OverlaysFeedbackPage() {
  const [dialog, setDialog] = useState(false);
  const [alert, setAlert] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [bottomSheet, setBottomSheet] = useState(false);
  const [popover, setPopover] = useState(false);
  const [menu, setMenu] = useState(false);
  const [banner, setBanner] = useState(true);
  const [lastAction, setLastAction] = useState('Nothing selected yet');
  const popoverAnchor = useRef<HTMLButtonElement>(null);
  const menuAnchor = useRef<HTMLButtonElement>(null);
  const toast = useToastQueue();

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OntologyX UI overlays and feedback Components">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="overlays" />

            <section className="ui-studio-hero ui-overlays-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP09</Label>
                  <Label tone="tertiary">Components · overlays + feedback</Label>
                </Row>
                <Heading level={1} size="display">One transient layer system. Many developer-facing compositions.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Dialogs, sheets, menus, popovers and tooltips now share the same overlay/floating/focus services.
                  Feedback stays generic: transient messages are not a notification center.
                </Text>
              </Stack>
            </section>

            {banner ? (
              <Banner
                tone="accent"
                title="Component ownership moved"
                message="Generic overlay implementation and styling now live in Components, not legacy Patterns/System UI."
                action={{ label: 'Toast it', onAction: () => toast.push({ message: 'Overlay ownership is component-level.', tone: 'success' }) }}
                onDismiss={() => setBanner(false)}
              />
            ) : null}

            <Grid min="wide" gap="lg">
              <Surface material="glass" radius="xl" className="ui-overlays-card">
                <Stack gap="md">
                  <Label tone="accent" emphasis="strong">Modal family</Label>
                  <Heading level={2} size="title">Dialog + AlertDialog</Heading>
                  <Text tone="secondary">Shared focus trap, restore, Escape and scroll isolation.</Text>
                  <Row gap="sm" className="ui-overlays-actions">
                    <Button variant="filled" onClick={() => setDialog(true)}>Open dialog</Button>
                    <Button tone="danger" onClick={() => setAlert(true)}>Confirm removal</Button>
                  </Row>
                </Stack>
              </Surface>

              <Surface material="glass" radius="xl" className="ui-overlays-card">
                <Stack gap="md">
                  <Label tone="accent" emphasis="strong">Sheet family</Label>
                  <Heading level={2} size="title">Adaptive + touch-first</Heading>
                  <Text tone="secondary">Auto Sheet adapts by available space. BottomSheet adds gesture-arena drag ownership.</Text>
                  <Row gap="sm" className="ui-overlays-actions">
                    <Button onClick={() => setSheet(true)}>Adaptive sheet</Button>
                    <Button onClick={() => setBottomSheet(true)}>Bottom sheet</Button>
                  </Row>
                </Stack>
              </Surface>
            </Grid>

            <Grid min="wide" gap="lg">
              <Surface material="glass" radius="xl" className="ui-overlays-card">
                <Stack gap="md">
                  <Label tone="accent" emphasis="strong">Anchored layers</Label>
                  <Row gap="sm" className="ui-overlays-actions">
                    <Button ref={popoverAnchor} onClick={() => setPopover((value) => !value)}>Popover</Button>
                    <Button ref={menuAnchor} onClick={() => setMenu((value) => !value)}>Menu</Button>
                    <Tooltip content="Supplemental help only — never an essential action.">
                      <Button>Tooltip</Button>
                    </Tooltip>
                  </Row>
                  <Text tone="secondary">Last menu/context action: {lastAction}</Text>
                </Stack>
              </Surface>

              <ContextMenu
                ariaLabel="Card actions"
                actions={[
                  { id: 'open', label: 'Open', onSelect: () => setLastAction('Open') },
                  { id: 'rename', label: 'Rename', onSelect: () => setLastAction('Rename') },
                  { id: 'remove', label: 'Remove', destructive: true, separatorBefore: true, onSelect: () => setLastAction('Remove') },
                ]}
              >
                <Surface material="subtle" radius="xl" className="ui-overlays-card ui-overlays-context-target" tabIndex={0}>
                  <Stack gap="sm">
                    <Label tone="accent" emphasis="strong">ContextMenu</Label>
                    <Text>Right-click, Shift+F10 or long-press this surface.</Text>
                  </Stack>
                </Surface>
              </ContextMenu>
            </Grid>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Direction + modality matrix</Label>
                  <Heading level={2} size="title">Same contract in LTR/RTL and coarse pointer environments</Heading>
                </Stack>
                <Grid min="wide" gap="md">
                  <OverlayMatrix direction="ltr" />
                  <OverlayMatrix direction="rtl" />
                </Grid>
              </Stack>
            </section>

            <Surface material="subtle" radius="xl" className="ui-overlays-card">
              <Stack gap="md">
                <Label tone="accent" emphasis="strong">Transient feedback</Label>
                <Row gap="sm" className="ui-overlays-actions">
                  <Button onClick={() => toast.push({ message: 'Changes saved', tone: 'success' })}>Success toast</Button>
                  <Button onClick={() => toast.push({ title: 'Connection lost', message: 'Working offline.', tone: 'warning', durationMs: null, action: { label: 'Retry', onAction: () => setLastAction('Retry') } })}>Persistent toast</Button>
                  <Button tone="danger" onClick={() => toast.push({ message: 'Could not remove item', tone: 'danger' })}>Danger toast</Button>
                  <Button onClick={toast.clear}>Clear</Button>
                </Row>
                <Text tone="secondary">Hover/focus a timed toast to pause dismissal. Safe-area placement is logical.</Text>
              </Stack>
            </Surface>
          </Stack>
        </ScrollView>
      </main>

      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title="Shared modal lifecycle"
        description="This surface uses the same stack, focus and dismissal owner as every other modal overlay."
        actions={<Button variant="filled" onClick={() => setDialog(false)}>Done</Button>}
      >
        <Stack gap="sm">
          <Text>Press Escape to close, then verify focus returns to the trigger.</Text>
          <Button onClick={() => toast.push({ message: 'Nested action executed', tone: 'accent' })}>Nested action</Button>
        </Stack>
      </Dialog>

      <AlertDialog
        open={alert}
        onOpenChange={setAlert}
        title="Remove this item?"
        description="Outside press is disabled for consequential confirmation."
        confirmLabel="Remove"
        confirmTone="danger"
        onConfirm={() => toast.push({ message: 'Item removed', tone: 'success' })}
      />

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        placement="auto"
        ariaLabel="Adaptive sheet"
        header={<div className="ui-overlays-sheet-copy"><strong>Adaptive sheet</strong><Text tone="secondary">Bottom in narrow space, centered in wider space.</Text></div>}
        footer={<Button variant="filled" onClick={() => setSheet(false)}>Done</Button>}
      >
        <div className="ui-overlays-sheet-content">Generic task content stays independent from OXS System UI semantics.</div>
      </Sheet>

      <BottomSheet
        open={bottomSheet}
        onOpenChange={setBottomSheet}
        ariaLabel="Draggable bottom sheet"
        header={<strong>Gesture-owned bottom sheet</strong>}
      >
        <div className="ui-overlays-sheet-content">Drag the grabber or use Escape. The gesture arena owns the interaction.</div>
      </BottomSheet>

      <Popover open={popover} onOpenChange={setPopover} anchorRef={popoverAnchor} ariaLabel="Studio popover">
        <div className="ui-overlays-popover-copy"><strong>Logical floating</strong><Text tone="secondary">Resize the Studio or switch RTL in the matrix below.</Text></div>
      </Popover>

      <Menu open={menu} onOpenChange={setMenu} anchorRef={menuAnchor} ariaLabel="Studio menu">
        <MenuItem onSelect={() => { setLastAction('Duplicate'); setMenu(false); }}>Duplicate</MenuItem>
        <MenuItem onSelect={() => { setLastAction('Move'); setMenu(false); }}>Move</MenuItem>
        <MenuItem destructive onSelect={() => { setLastAction('Delete'); setMenu(false); }}>Delete</MenuItem>
      </Menu>

      <ToastHost items={toast.toasts} onDismiss={toast.dismiss} />
    </UiRoot>
  );
}

function OverlayMatrix({ direction }: { direction: 'ltr' | 'rtl' }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <UiRoot scope="nested" direction={direction} modality="touch" pointerPrecision="coarse">
      <Surface material="glass" radius="xl" className="ui-overlays-card ui-overlays-card--matrix">
        <Stack gap="md">
          <Row justify="between" gap="sm">
            <Label tone="accent" emphasis="strong">{direction.toUpperCase()}</Label>
            <Label tone="tertiary">coarse pointer</Label>
          </Row>
          <Button ref={anchor} onClick={() => setOpen((value) => !value)}>Open logical popover</Button>
          <Popover open={open} onOpenChange={setOpen} anchorRef={anchor} placement="bottom-start" ariaLabel={`${direction} popover`}>
            <div className="ui-overlays-popover-copy">{direction === 'rtl' ? 'شروع منطقی در راست‌به‌چپ' : 'Logical start in LTR'}</div>
          </Popover>
        </Stack>
      </Surface>
    </UiRoot>
  );
}
