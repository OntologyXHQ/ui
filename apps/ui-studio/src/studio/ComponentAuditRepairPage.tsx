import {
  Badge,
  Button,
  Card,
  Dialog,
  Disclosure,
  Grid,
  Heading,
  Icon,
  IconButton,
  Label,
  List,
  ListItem,
  Progress,
  Row,
  ScrollView,
  SegmentedControl,
  Select,
  Spinner,
  Stack,
  StatusIndicator,
  TabPanel,
  Tabs,
  Text,
  TextArea,
  TextField,
  Tile,
  TileGrid,
  ToggleGroup,
  Tooltip,
  tabRelationshipIds,
  UiRoot,
} from '@ontologyx/ui';
import { useState } from 'react';
import { StudioNav } from './StudioNav';

const selectionOptions = [
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
] as const;

const selectOptions = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
] as const;

export function ComponentAuditRepairPage() {
  const [segment, setSegment] = useState('missing');
  const [toggles, setToggles] = useState<readonly string[]>([]);
  const [choice, setChoice] = useState('');
  const [manualTab, setManualTab] = useState('runtime');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rowAction, setRowAction] = useState('none');
  const [tileAction, setTileAction] = useState('none');

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS component floor audit repair">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="audit" />

            <section className="ui-studio-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">Pre-UIP13</Label>
                  <Label tone="tertiary">Runtime + SDK boundary repair v2</Label>
                </Row>
                <Heading level={1} size="display">Runtime ownership and the public SDK are being hardened before Studio self-hosting.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  This workbench now covers both independent audits: interaction correctness, per-UiRoot overlay/editing
                  ownership, logical scrolling, Gesture Arena drag/drop, host-safe CSS, canonical SDK boundaries,
                  trigger-owned Select focus, spatial navigation and deliberate live-region semantics.
                </Text>
              </Stack>
            </section>

            <Grid min="wide" gap="lg">
              <Card
                title="Press + keyboard authority"
                description="Focus the button and hold Space/Enter: pressed state is now shared with pointer activation without replacing native button semantics."
                actions={<StatusIndicator tone="success" label="Regression covered" />}
              >
                <Row gap="sm" align="center">
                  <Button variant="filled">Keyboard press target</Button>
                  <Badge>Space / Enter</Badge>
                </Row>
              </Card>

              <Card
                title="Roving selection never loses the Tab entry"
                description="These controls intentionally begin with an invalid/disabled controlled value. One enabled item must still remain tabbable."
              >
                <Stack gap="md">
                  <SegmentedControl
                    label="Audit segmented control"
                    options={selectionOptions}
                    value={segment}
                    onValueChange={setSegment}
                  />
                  <ToggleGroup
                    label="Audit toggle group"
                    options={selectionOptions}
                    value={toggles}
                    onValueChange={setToggles}
                  />
                  <Label tone="tertiary">Segment value: {segment} · toggles: {toggles.join(', ') || 'none'}</Label>
                </Stack>
              </Card>

              <Card
                title="Select uses real form semantics"
                description="Required validity lives in a native proxy while the visible combobox keeps DOM focus, aria-activedescendant and normal Tab continuation across its portaled listbox."
              >
                <form onSubmit={(event) => event.preventDefault()}>
                  <Stack gap="sm">
                    <Select
                      label="Required destination"
                      required
                      name="audit-destination"
                      options={selectOptions}
                      value={choice}
                      onValueChange={setChoice}
                    />
                    <Button type="submit" size="sm">Validate form</Button>
                  </Stack>
                </form>
              </Card>

              <Card
                title="Trailing actions are siblings, not nested buttons"
                description="The row can activate independently while its trailing action remains a separate interactive target."
              >
                <Stack gap="sm">
                  <List label="Nested interaction regression">
                    <ListItem
                      primary="Actionable row"
                      secondary={`Last action: ${rowAction}`}
                      onActivate={() => setRowAction('row')}
                      trailing={<IconButton icon="settings" label="Row settings" size="sm" onClick={() => setRowAction('trailing')} />}
                    />
                  </List>
                  <Tile
                    title="Actionable tile"
                    description={`Last action: ${tileAction}`}
                    leading={<Icon name="apps" />}
                    onActivate={() => setTileAction('tile')}
                    trailing={<IconButton icon="settings" label="Tile settings" size="sm" onClick={() => setTileAction('trailing')} />}
                  />
                </Stack>
              </Card>
            </Grid>

            <Grid min="wide" gap="lg">
              <Card
                title="UiRoot-scoped overlays"
                description="Dialog and drag/tooltip layers now portal into the owning UiRoot instead of document.body, preserving nested theme/direction and avoiding ancestor clipping."
                actions={<Button onClick={() => setDialogOpen(true)}>Open dialog</Button>}
              >
                <UiRoot scope="nested" direction="rtl" pointerPrecision="coarse" modality="touch">
                  <Stack gap="sm">
                    <Label tone="accent">Nested RTL · coarse pointer</Label>
                    <Tooltip content="Keyboard focus remains available on coarse-pointer hosts" delayMs={0}>
                      <Button>Focus for tooltip</Button>
                    </Tooltip>
                  </Stack>
                </UiRoot>
              </Card>

              <Card
                title="2D spatial keyboard navigation"
                description="A tile collection exposes one Tab entry and arrow keys choose the nearest action in the requested geometric direction instead of treating Up/Down as ±1."
              >
                <TileGrid label="Audit keyboard grid" keyboardNavigation density="compact">
                  <Tile title="One" onActivate={() => setTileAction('one')} />
                  <Tile title="Two" onActivate={() => setTileAction('two')} />
                  <Tile title="Three" onActivate={() => setTileAction('three')} />
                </TileGrid>
              </Card>

              <Card
                title="Invalid progress input is normalized"
                description="A zero/invalid max can no longer produce NaN percentages or an invalid native progress maximum."
              >
                <Progress label="Audit progress" value={42} max={0} showValue />
              </Card>

              <Card
                title="Runtime isolation"
                description="Motion shared-bounds, drag previews, overlay hosts and toast timers now belong to their runtime/root instead of leaking through module-global or document-global state."
              >
                <List label="Runtime repair coverage" divided>
                  <ListItem primary="Overlay/modal coordinator" trailing={<Badge tone="success">per UiRoot</Badge>} />
                  <ListItem primary="Editing + clipboard" trailing={<Badge tone="success">scoped</Badge>} />
                  <ListItem primary="Logical RTL scroll + snap" trailing={<Badge tone="success">normalized</Badge>} />
                  <ListItem primary="Drag/drop ownership" trailing={<Badge tone="success">Gesture Arena</Badge>} />
                  <ListItem primary="Motion shared bounds" trailing={<Badge tone="success">scoped</Badge>} />
                  <ListItem primary="Toast duration + IDs" trailing={<Badge tone="success">stable</Badge>} />
                </List>
              </Card>
            </Grid>

            <Grid min="wide" gap="lg">
              <Card
                title="Canonical SDK surface"
                description="Runtime plumbing and compatibility aliases no longer masquerade as ordinary UI Kit components in the root package/catalog."
              >
                <List label="Package surfaces" divided>
                  <ListItem primary="@ontologyx/ui" secondary="Canonical developer + System visual SDK" trailing={<Badge tone="success">Catalog</Badge>} />
                  <ListItem primary="@ontologyx/ui/advanced" secondary="Runtime diagnostics and platform integration" trailing={<Badge>Explicit</Badge>} />
                  <ListItem primary="Legacy compatibility" secondary="Removed at UIP14; canonical System/Component owners only" trailing={<Badge tone="success">Removed</Badge>} />
                </List>
              </Card>

              <Card
                title="Editing lifecycle + secure input seams"
                description="Focused field teardown ends the runtime session, clipboard transport belongs to the UiRoot and delayed paste cannot mutate stale selection state."
              >
                <TextField label="Secure audit field" defaultValue="private value" secure description="Copy/cut is blocked from keyboard and context-menu paths." />
              </Card>

              <Card
                title="React-owned disclosure + manual Tabs"
                description="Controlled disclosure state no longer races native details mutation, while manual tabs separate focused and selected values."
              >
                <Stack gap="md">
                  <Disclosure summary="Controlled interaction contract" defaultOpen>
                    Disclosure content is owned by the UI Kit state contract.
                  </Disclosure>
                  <Tabs
                    label="Audit runtime sections"
                    activationMode="manual"
                    value={manualTab}
                    onValueChange={setManualTab}
                    items={[
                      { value: 'runtime', label: 'Runtime', id: tabRelationshipIds('audit', 'runtime').tabId, panelId: tabRelationshipIds('audit', 'runtime').panelId },
                      { value: 'sdk', label: 'SDK', id: tabRelationshipIds('audit', 'sdk').tabId, panelId: tabRelationshipIds('audit', 'sdk').panelId },
                    ]}
                  />
                  <TabPanel
                    id={tabRelationshipIds('audit', manualTab).panelId}
                    value={manualTab}
                    activeValue={manualTab}
                    labelledBy={tabRelationshipIds('audit', manualTab).tabId}
                  >
                    {manualTab === 'runtime' ? 'Arrow focus can move without changing this panel until activation.' : 'The canonical catalog comes only from @ontologyx/ui.'}
                  </TabPanel>
                </Stack>
              </Card>

              <Card
                title="Live feedback is deliberate"
                description="Static status/activity visuals stay quiet; announcement is an explicit state-transition decision instead of an automatic side effect."
              >
                <Row gap="md" align="center">
                  <StatusIndicator label="Connected" tone="success" />
                  <Spinner label="Background refresh" />
                  <StatusIndicator label="Sync completed" tone="accent" announce />
                </Row>
              </Card>
            </Grid>
          </Stack>
        </ScrollView>

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Scoped modal audit"
          description="Tab through this surface, then press Escape. Focus should stay inside while open and return to the trigger after close."
          actions={<Button variant="filled" onClick={() => setDialogOpen(false)}>Done</Button>}
        >
          <Stack gap="sm">
            <TextArea
              label="Textarea focus target"
              defaultValue="Textarea is part of the shared focus selector."
            />
            <Select
              label="Select focus target"
              options={selectOptions}
              defaultValue="one"
            />
          </Stack>
        </Dialog>
      </main>
    </UiRoot>
  );
}
