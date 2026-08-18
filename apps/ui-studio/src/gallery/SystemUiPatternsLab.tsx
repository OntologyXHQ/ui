import {
  BottomSheet,
  Button,
  ContextMenu,
  Grid,
  Heading,
  IconButton,
  Label,
  Menu,
  MenuItem,
  MenuSeparator,
  Row,
  Stack,
  Surface,
  Text,
  Tooltip,
} from '@ontologyx/ui';
import { useRef, useState } from 'react';

const contextActions = [
  {
    id: 'open',
    label: 'Open',
    onSelect: () => undefined,
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    onSelect: () => undefined,
  },
  {
    id: 'remove',
    label: 'Remove',
    destructive: true,
    separatorBefore: true,
    onSelect: () => undefined,
  },
] as const;

export function SystemUiPatternsLab() {
  const menuAnchorRef = useRef<HTMLButtonElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Surface className="ui-kit-gallery__stage" material="glass" elevation={1} radius="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">
            System UI patterns
          </Label>
          <Heading level={3} size="heading">
            One overlay policy for sheets, menus, context actions, and hints
          </Heading>
          <Text tone="secondary">
            Escape, outside dismissal, focus return, collision handling, safe touch targets, and
            reduced-motion behavior live in the UI Kit instead of feature code.
          </Text>
        </Stack>

        <Row gap="sm" className="ui-kit-gallery__control-row">
          <Button variant="filled" onClick={() => setSheetOpen(true)}>
            Open bottom sheet
          </Button>
          <Button
            ref={menuAnchorRef}
            variant="soft"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            Open menu
          </Button>
          <Tooltip content="Tooltips appear for fine-pointer hover and keyboard focus.">
            <IconButton icon="settings" label="Tooltip example" />
          </Tooltip>
        </Row>

        <Grid min="card" gap="md">
          <ContextMenu ariaLabel="Example context menu" actions={contextActions}>
            <Button className="ui-kit-gallery__context-target" variant="soft" fullWidth>
              Right-click, press Shift+F10, use the Menu key, or long-press
            </Button>
          </ContextMenu>

          <Surface material="subtle" elevation={0} radius="md" border="subtle">
            <Stack gap="xs">
              <Label emphasis="strong">Adaptive floating placement</Label>
              <Text tone="secondary">
                Popovers flip and clamp to the viewport instead of overflowing the screen edge.
              </Text>
            </Stack>
          </Surface>
        </Grid>

        <Menu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          anchorRef={menuAnchorRef}
          placement="bottom-start"
          ariaLabel="Example actions"
        >
          <MenuItem onSelect={() => setMenuOpen(false)}>Open workspace</MenuItem>
          <MenuItem onSelect={() => setMenuOpen(false)}>Pin application</MenuItem>
          <MenuSeparator />
          <MenuItem data-destructive="true" onSelect={() => setMenuOpen(false)}>
            Remove
          </MenuItem>
        </Menu>

        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          ariaLabel="Bottom sheet example"
          footer={
            <Row justify="end" gap="sm">
              <Button variant="ghost" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button variant="filled" onClick={() => setSheetOpen(false)}>
                Done
              </Button>
            </Row>
          }
        >
          <Stack gap="md">
            <Label tone="accent" emphasis="strong">
              Bottom sheet
            </Label>
            <Heading level={2} size="title">
              System-owned presentation
            </Heading>
            <Text tone="secondary">
              This pattern owns its scrim, focus restoration, Escape dismissal, safe areas, and
              motion. Product features only provide content and controlled state.
            </Text>
          </Stack>
        </BottomSheet>
      </Stack>
    </Surface>
  );
}
