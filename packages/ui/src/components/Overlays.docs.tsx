import {
  AlertDialog,
  BottomSheet,
  Button,
  ContextMenu,
  Dialog,
  Menu,
  MenuItem,
  MenuSeparator,
  Popover,
  Row,
  Sheet,
  Stack,
  Text,
  Tooltip,
  UiRoot,
  Wrap,
} from '@ontologyx/ui';
import { useRef, useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Dialog',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Modal or non-modal task surface on the shared overlay lifecycle.',
    usage: 'Use for focused transient tasks without product-specific shell semantics.',
    status: 'accepted',
    accessibility:
      'Owns dialog semantics, focus containment/restoration, Escape policy and title/description wiring.',
    rtl: 'Content and actions use logical flow.',
    touch: 'Actions inherit shared touch targets and outside dismissal is explicit.',
    responsive: 'Size variants clamp to available space; fullscreen remains opt-in.',
    examples: [
      { id: 'overview', title: 'Dialog lifecycle', component: 'DialogExample' },
      {
        id: 'authority',
        title: 'Cross-root overlay authority',
        component: 'OverlayAuthorityExample',
      },
    ],
  },
  {
    exportName: 'AlertDialog',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Confirmation dialog with explicit cancel/confirm semantics.',
    usage: 'Use for consequential confirmation; outside press is intentionally disabled.',
    status: 'accepted',
    accessibility: 'Uses alertdialog semantics and the same modal focus lifecycle as Dialog.',
    rtl: 'Action order follows semantic source order and logical layout.',
    touch: 'Confirmation actions keep the shared coarse-pointer target floor.',
    responsive: 'Uses Dialog sizing and containment rules.',
    examples: [{ id: 'overview', title: 'Confirmation', component: 'AlertDialogExample' }],
  },
  {
    exportName: 'Sheet',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Adaptive transient task surface using shared overlay and safe-area services.',
    usage:
      'Use for layered supporting tasks; auto placement adapts without OXS-specific layout assumptions.',
    status: 'accepted',
    accessibility: 'Provides dialog semantics, focus containment/restoration and Escape handling.',
    rtl: 'Content follows logical direction while bottom is a physical edge.',
    touch: 'Optional drag ownership is delegated to the shared gesture arena.',
    responsive:
      'Auto placement resolves to bottom on narrow containers and centered presentation on wider containers.',
    examples: [{ id: 'preview', title: 'Sheet interaction', component: 'SheetPreviewExample' }],
  },
  {
    exportName: 'BottomSheet',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Touch-first bottom-edge Sheet with gesture-arena drag interaction.',
    usage: 'Use for transient tasks whose physical bottom-edge presentation is intentional.',
    status: 'accepted',
    accessibility: 'Inherits Sheet dialog and focus semantics.',
    rtl: 'Bottom edge does not mirror; content remains bidi-aware.',
    touch: 'Drag gesture is first-class and competes through the shared gesture arena.',
    responsive: 'Height and safe-area padding adapt to available space.',
    examples: [
      { id: 'preview', title: 'Bottom sheet interaction', component: 'BottomSheetPreviewExample' },
    ],
  },
  {
    exportName: 'Popover',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Anchored floating surface on shared collision, observation and dismissal services.',
    usage: 'Use for lightweight anchored content.',
    status: 'accepted',
    accessibility:
      'Supports dialog/menu roles, Escape dismissal and optional modal focus containment.',
    rtl: 'Logical start/end placements resolve with writing direction.',
    touch: 'Outside press works across coarse and fine pointers.',
    responsive: 'Collision/flip and geometry observation respond to available viewport space.',
    playground: {
      preferredWidth: 'medium',
      fixture: {
        anchorRect: { top: 120, right: 260, bottom: 164, left: 120, width: 140, height: 44 },
        ariaLabel: 'Preview overlay',
        open: true,
      },
    },
    examples: [
      { id: 'preview', title: 'Anchored popover', component: 'PopoverPreviewExample' },
      { id: 'modal-focus', title: 'Modal focus isolation', component: 'PopoverModalFocusExample' },
    ],
  },
  {
    exportName: 'Menu',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Keyboard-navigable action menu hosted by the shared Popover implementation.',
    usage: 'Use for a concise set of commands rather than generic content.',
    status: 'accepted',
    accessibility: 'Owns menu role, initial focus and vertical roving navigation.',
    rtl: 'Placement is logical and command content follows writing direction.',
    touch: 'Menu targets honor coarse-pointer sizing.',
    responsive: 'Floating placement responds to available space.',
    playground: {
      preferredWidth: 'medium',
      fixture: {
        anchorRect: { top: 120, right: 260, bottom: 164, left: 120, width: 140, height: 44 },
        ariaLabel: 'Preview overlay',
        open: true,
      },
    },
    examples: [{ id: 'preview', title: 'Anchored menu', component: 'MenuPreviewExample' }],
  },
  {
    exportName: 'MenuItem',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Action row inside Menu.',
    usage: 'Use only inside Menu for command-like actions.',
    status: 'accepted',
    accessibility: 'Uses native button plus menuitem semantics.',
    rtl: 'Content uses logical flow.',
    touch: 'Target sizing follows shared Component tokens.',
    responsive: 'Width follows the owning Menu surface.',
    examples: [
      { id: 'menu-contract', title: 'Menu item contract', component: 'MenuPreviewExample' },
    ],
  },
  {
    exportName: 'MenuSeparator',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Semantic separator inside Menu.',
    usage: 'Use sparingly to group related commands.',
    status: 'accepted',
    accessibility: 'Rendered as a native separator.',
    rtl: 'Direction-neutral.',
    touch: 'Non-interactive.',
    responsive: 'Fills the Menu inline size.',
    examples: [
      { id: 'menu-contract', title: 'Menu separator contract', component: 'MenuPreviewExample' },
    ],
  },
  {
    exportName: 'ContextMenu',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Contextual Menu invoked from pointer position, keyboard or long press.',
    usage: 'Use for actions whose meaning is tied to a target context.',
    status: 'accepted',
    accessibility: 'Supports ContextMenu/Shift+F10 and Menu semantics.',
    rtl: 'Floating placement and command flow are writing-direction aware.',
    touch: 'Long press uses the shared press/gesture path.',
    responsive: 'Placement responds to viewport collision.',
    examples: [{ id: 'preview', title: 'Context actions', component: 'ContextMenuPreviewExample' }],
  },
  {
    exportName: 'Tooltip',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Supplemental delayed description associated with a trigger.',
    usage:
      'Use only for supplemental help; essential information must remain available without hover.',
    status: 'accepted',
    accessibility:
      'Trigger owns aria-describedby while Tooltip participates in shared Escape/stack lifecycle without stealing focus.',
    rtl: 'Placement uses logical alignment.',
    touch: 'Touch hover activation is intentionally suppressed.',
    responsive: 'Floating placement adapts around viewport edges.',
    examples: [{ id: 'preview', title: 'Supplemental help', component: 'TooltipPreviewExample' }],
  },
] as const);

export function DialogExample() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [popover, setPopover] = useState(false);
  return (
    <Stack gap="sm">
      <Row gap="sm">
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Button ref={anchorRef} onClick={() => setPopover(true)}>
          Open popover
        </Button>
      </Row>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Example dialog"
        description="One overlay lifecycle."
        actions={
          <Button variant="primary" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        <Text>Focus, Escape and restoration are owned centrally.</Text>
      </Dialog>
      <Popover
        open={popover}
        onOpenChange={setPopover}
        anchorRef={anchorRef}
        ariaLabel="Example popover"
      >
        <div className="ui-doc-example-chip">Anchored content</div>
      </Popover>
    </Stack>
  );
}

export function AlertDialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button intent="destructive" onClick={() => setOpen(true)}>
        Remove item
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Remove item?"
        description="Explicit confirm/cancel ownership."
        confirmLabel="Remove"
        confirmTone="danger"
        onConfirm={() => {}}
      />
    </>
  );
}

export function ContextMenuPreviewExample() {
  return (
    <ContextMenu
      ariaLabel="File actions"
      actions={[
        { id: 'open', label: 'Open', onSelect: () => undefined },
        { id: 'rename', label: 'Rename', onSelect: () => undefined },
        {
          id: 'remove',
          label: 'Remove',
          destructive: true,
          separatorBefore: true,
          onSelect: () => undefined,
        },
      ]}
    >
      <Button variant="secondary">Right-click or long-press</Button>
    </ContextMenu>
  );
}

export function TooltipPreviewExample() {
  return (
    <Tooltip content="Supplemental keyboard and pointer help">
      <Button variant="secondary">Hover or focus me</Button>
    </Tooltip>
  );
}

export function SheetPreviewExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        ariaLabel="Preview sheet"
        header={<Text>Sheet preview</Text>}
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <Text>This is the real shared Sheet surface.</Text>
      </Sheet>
    </>
  );
}

export function BottomSheetPreviewExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open bottom sheet
      </Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        ariaLabel="Preview bottom sheet"
        header={<Text>Bottom sheet preview</Text>}
      >
        <Text>Drag or dismiss the actual BottomSheet.</Text>
      </BottomSheet>
    </>
  );
}

export function PopoverPreviewExample() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button ref={anchorRef} variant="secondary" onClick={() => setOpen((value) => !value)}>
        Toggle popover
      </Button>
      <Popover open={open} onOpenChange={setOpen} anchorRef={anchorRef} ariaLabel="Preview popover">
        <Text>Anchored public Popover.</Text>
      </Popover>
    </>
  );
}

export function PopoverModalFocusExample() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button ref={anchorRef} variant="secondary" onClick={() => setOpen(true)}>
        Open modal popover
      </Button>
      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={anchorRef}
        ariaLabel="Modal popover example"
        modal
        autoFocus={false}
      >
        <Stack gap="xs">
          <Text>Focus enters the modal surface before background isolation is applied.</Text>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Stack>
      </Popover>
    </>
  );
}

export function MenuPreviewExample() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button ref={anchorRef} variant="secondary" onClick={() => setOpen((value) => !value)}>
        Open menu
      </Button>
      <Menu open={open} onOpenChange={setOpen} anchorRef={anchorRef} ariaLabel="Preview menu">
        <MenuItem>Open</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem destructive>Remove</MenuItem>
      </Menu>
    </>
  );
}

export function OverlayAuthorityExample() {
  return (
    <Stack gap="sm">
      <Text>
        Independent UiRoots keep local modal isolation while one Document realm arbitrates top-most
        events. Outside dismissal is disabled in this fixture so both roots stay open long enough to
        certify cross-root portal stacking and Escape order; outside-pointer arbitration is covered
        independently by the runtime tests.
      </Text>
      <Wrap gap="sm">
        <OverlayAuthorityScope scope="A" />
        <OverlayAuthorityScope scope="B" />
      </Wrap>
    </Stack>
  );
}

function OverlayAuthorityScope({ scope }: { scope: 'A' | 'B' }) {
  const [open, setOpen] = useState(false);
  return (
    <UiRoot
      className={`ui-doc-overlay-authority-root ui-doc-overlay-authority-root--${scope.toLowerCase()}`}
    >
      <Stack gap="xs">
        <Text>Root {scope}</Text>
        <Button onClick={() => setOpen(true)}>Open modal {scope}</Button>
      </Stack>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Authority modal ${scope}`}
        dismissOnOutsidePress={false}
      >
        <Stack gap="xs">
          <Text>Modal owned by root {scope}.</Text>
          <Button onClick={() => setOpen(false)}>Close modal {scope}</Button>
        </Stack>
      </Dialog>
    </UiRoot>
  );
}
