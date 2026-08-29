import {
  AppBar,
  Badge,
  Box,
  Button,
  Code,
  createUiBindingRegistry,
  createUiCommandRegistry,
  createUiResolverEnvironment,
  createUiSourceRegistry,
  defineCommand,
  defineUi,
  defineUiBinding,
  defineUiSource,
  Grid,
  Heading,
  inspectUiRuntime,
  invokeUiInspectionCommand,
  Label,
  resolveUiDefinition,
  Row,
  ScrollView,
  Stack,
  Surface,
  Text,
  ui,
  type UiCommandInvocation,
  type UiInspectionFocus,
  type UiResolverContainer,
  type UiResolverEnvironment,
} from '@ontologyx/ui';
import {
  SemanticCollection,
  SemanticCommandGroup,
  SemanticConfirmation,
  SemanticForm,
  SemanticWorkspace,
  useUiEnvironment,
} from '@ontologyx/ui/advanced';
import { useMemo, useState } from 'react';
import { updateStudioView } from '../catalog/routing';
import { useStudioEnvironment } from './StudioEnvironment';
import { StudioEnvironmentToolbar } from './StudioEnvironmentToolbar';

type FixtureContext = {
  displayName: string;
  appearance: string;
  reducedMotion: boolean;
  setDisplayName: (value: string) => void;
  setAppearance: (value: string) => void;
  setReducedMotion: (value: boolean) => void;
  selectedFiles: readonly string[];
  setSelectedFiles: (value: readonly string[]) => void;
  setLastCommand: (value: string) => void;
  setLastTarget: (value: string) => void;
};

const semanticFixture = defineUi({
  id: 'studio.semantic-v2',
  nodes: [
    ui.commandGroup({
      id: 'studio.semantic-actions',
      label: 'Settings actions',
      commands: [
        { command: 'settings.save', emphasis: 'primary' },
        { command: 'settings.preview', emphasis: 'secondary' },
        { command: 'settings.copy-link' },
        { command: 'settings.export' },
        { command: 'settings.help' },
      ],
      presentation: { preferred: 'inline' },
    }),
    ui.form({
      id: 'studio.settings-form',
      title: 'Semantic settings',
      description: 'Values are host-owned; the Author IR contains only stable binding/source IDs.',
      fields: [
        ui.field({
          id: 'studio.display-name',
          binding: 'settings.display-name',
          label: 'Display name',
          description: 'A string binding resolved by the host-owned registry.',
          placeholder: 'Name',
        }),
        ui.choice({
          id: 'studio.appearance',
          binding: 'settings.appearance',
          optionsSource: 'settings.appearance-options',
          label: 'Appearance',
          description: 'The segmented preference falls back to Select in compact/touch contexts.',
          presentation: { preferred: 'segmented' },
        }),
        ui.toggle({
          id: 'studio.reduced-motion',
          binding: 'settings.reduced-motion',
          label: 'Reduce motion',
          description: 'Boolean mutation remains outside Author IR.',
        }),
      ],
    }),
    ui.collection({
      id: 'studio.file-places',
      source: 'files.places',
      navigation: { mode: 'linear' },
      presentation: { preferred: 'list' },
    }),
    ui.collection({
      id: 'studio.recent-files',
      source: 'files.recent',
      selection: { mode: 'multiple', binding: 'files.selection' },
      navigation: { mode: 'spatial' },
      commands: ['file.open'],
      activationCommand: 'file.open',
      presentation: { preferred: 'grid' },
    }),
    ui.form({
      id: 'studio.file-inspector',
      title: 'File details',
      description: 'Inspector data is derived from host-owned selection, not embedded in IR.',
      fields: [
        ui.field({
          id: 'studio.selected-file',
          binding: 'files.selected-label',
          label: 'Selected file',
          readOnly: true,
        }),
      ],
    }),
    ui.workspace({
      id: 'studio.file-workspace',
      label: 'Semantic file workspace',
      regions: [
        {
          id: 'studio.file-sidebar',
          role: 'sidebar',
          label: 'Places',
          content: ['studio.file-places'],
        },
        {
          id: 'studio.file-pane',
          role: 'pane',
          label: 'Files',
          content: ['studio.recent-files'],
        },
        {
          id: 'studio.file-inspector-region',
          role: 'inspector',
          label: 'Inspector',
          content: ['studio.file-inspector'],
        },
      ],
    }),
    ui.confirmation({
      id: 'studio.reset-confirmation',
      title: 'Reset semantic settings?',
      description: 'This proves command authority remains external to the serialized IR.',
      confirmCommand: 'settings.reset',
      intent: 'destructive',
    }),
  ],
});

const bindings = createUiBindingRegistry<FixtureContext>([
  defineUiBinding<FixtureContext>({
    id: 'settings.display-name',
    kind: 'string',
    read: ({ displayName }) => displayName,
    write: (value, context) => {
      if (typeof value === 'string') context.setDisplayName(value);
    },
  }),
  defineUiBinding<FixtureContext>({
    id: 'settings.appearance',
    kind: 'string',
    read: ({ appearance }) => appearance,
    write: (value, context) => {
      if (typeof value === 'string') context.setAppearance(value);
    },
  }),
  defineUiBinding<FixtureContext>({
    id: 'settings.reduced-motion',
    kind: 'boolean',
    read: ({ reducedMotion }) => reducedMotion,
    write: (value, context) => {
      if (typeof value === 'boolean') context.setReducedMotion(value);
    },
  }),
  defineUiBinding<FixtureContext>({
    id: 'files.selection',
    kind: 'string-list',
    read: ({ selectedFiles }) => selectedFiles,
    write: (value, context) => {
      if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
        context.setSelectedFiles(value);
    },
  }),
  defineUiBinding<FixtureContext>({
    id: 'files.selected-label',
    kind: 'string',
    read: ({ selectedFiles }) => selectedFiles[0] ?? 'No file selected',
  }),
]);

const sources = createUiSourceRegistry<FixtureContext>([
  defineUiSource<FixtureContext>({
    id: 'settings.appearance-options',
    kind: 'options',
    read: () => [
      { id: 'system', value: 'system', label: 'System' },
      { id: 'light', value: 'light', label: 'Light' },
      { id: 'dark', value: 'dark', label: 'Dark' },
    ],
  }),
  defineUiSource<FixtureContext>({
    id: 'files.places',
    kind: 'collection',
    read: () => [
      { id: 'home', label: 'Home', description: 'Personal files' },
      { id: 'projects', label: 'Projects', description: 'Development workspaces' },
      { id: 'downloads', label: 'Downloads', description: 'Recent transfers' },
    ],
  }),
  defineUiSource<FixtureContext>({
    id: 'files.recent',
    kind: 'collection',
    read: () => ({
      items: [
        { id: 'readme', label: 'README.md', description: 'Project overview' },
        { id: 'roadmap', label: 'ROADMAP.md', description: 'Active V2 frontier' },
        { id: 'tokens', label: 'tokens.ts', description: 'Semantic token contracts' },
      ],
      offset: 0,
      totalCount: 12,
      hasMore: true,
    }),
  }),
]);

const commands = createUiCommandRegistry<FixtureContext>([
  defineCommand<FixtureContext>({
    id: 'settings.save',
    label: 'Save',
    shortcut: 'Control+S',
    execute: ({ setLastCommand }) => setLastCommand('settings.save'),
  }),
  defineCommand<FixtureContext>({
    id: 'settings.preview',
    label: 'Preview',
    execute: ({ setLastCommand }) => setLastCommand('settings.preview'),
  }),
  defineCommand<FixtureContext>({
    id: 'settings.copy-link',
    label: 'Copy link',
    shortcut: 'Control+Shift+C',
    execute: ({ setLastCommand }) => setLastCommand('settings.copy-link'),
  }),
  defineCommand<FixtureContext>({
    id: 'settings.export',
    label: 'Export',
    execute: ({ setLastCommand }) => setLastCommand('settings.export'),
  }),
  defineCommand<FixtureContext>({
    id: 'settings.help',
    label: 'Help',
    execute: ({ setLastCommand }) => setLastCommand('settings.help'),
  }),
  defineCommand<FixtureContext>({
    id: 'settings.reset',
    label: 'Reset',
    intent: 'destructive',
    execute: ({ setDisplayName, setAppearance, setReducedMotion, setLastCommand }) => {
      setDisplayName('OntologyX');
      setAppearance('system');
      setReducedMotion(false);
      setLastCommand('settings.reset');
    },
  }),
  defineCommand<FixtureContext>({
    id: 'file.open',
    label: 'Open',
    execute: ({ setLastCommand, setLastTarget }, invocation?: UiCommandInvocation) => {
      setLastCommand('file.open');
      setLastTarget(invocation?.target ?? 'none');
    },
  }),
]);

function adaptiveContainer(
  environment: ReturnType<typeof useStudioEnvironment>['environment'],
): UiResolverContainer {
  if (environment.container === 'compact' || environment.viewport === 'phone') return 'compact';
  if (environment.container === 'wide' || environment.viewport === 'ultrawide') return 'wide';
  return 'regular';
}

function JsonPanel({ id, title, value }: { id: string; title: string; value: unknown }) {
  return (
    <Surface
      material="subtle"
      radius="lg"
      className="ui-studio-semantic-panel"
      data-studio-semantic-json-panel={id}
    >
      <Stack gap="sm">
        <Row justify="between" align="center" gap="sm">
          <Heading level={2} size="title">
            {title}
          </Heading>
          <Badge size="sm">JSON</Badge>
        </Row>
        <pre className="ui-studio-semantic-code" tabIndex={0}>
          <Code>{JSON.stringify(value, null, 2)}</Code>
        </pre>
      </Stack>
    </Surface>
  );
}

export function SemanticWorkbench() {
  const { environment } = useStudioEnvironment();
  const resolvedEnvironment = useUiEnvironment();
  const [displayName, setDisplayName] = useState('OntologyX');
  const [appearance, setAppearance] = useState('system');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<readonly string[]>([]);
  const [lastCommand, setLastCommand] = useState('none');
  const [lastTarget, setLastTarget] = useState('none');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [inspectionFocus, setInspectionFocus] = useState<UiInspectionFocus | null>(null);
  const [inspectionStatus, setInspectionStatus] = useState('idle');

  const context = useMemo<FixtureContext>(
    () => ({
      displayName,
      appearance,
      reducedMotion,
      setDisplayName,
      setAppearance,
      setReducedMotion,
      selectedFiles,
      setSelectedFiles,
      setLastCommand,
      setLastTarget,
    }),
    [appearance, displayName, reducedMotion, selectedFiles],
  );

  const resolverEnvironment = createUiResolverEnvironment({
    container: adaptiveContainer(environment),
    modality: resolvedEnvironment.modality,
    density: resolvedEnvironment.density,
    direction: resolvedEnvironment.direction,
    pointerPrecision: resolvedEnvironment.pointerPrecision,
  });
  const runtime = resolveSemanticFixture(context, resolverEnvironment);
  const inspection = inspectUiRuntime(runtime, { focus: inspectionFocus });
  const focusedOpenAction = inspection.availableCommands.find(
    (command) =>
      command.command === 'file.open' &&
      command.sourceNode === 'studio.recent-files' &&
      command.scope === 'focused-item',
  );
  const commandGroup = runtime.nodes.find((node) => node.kind === 'command-group');
  const form = runtime.nodes.find(
    (node) => node.kind === 'form' && node.id === 'studio.settings-form',
  );
  const workspace = runtime.nodes.find((node) => node.kind === 'workspace');
  const confirmation = runtime.nodes.find((node) => node.kind === 'confirmation');
  const runtimeNode = (id: string) => runtime.nodes.find((node) => 'id' in node && node.id === id);

  return (
    <Box as="main" className="ui-studio-semantic-shell" data-studio-semantic-workbench>
      <AppBar
        className="ui-studio-appbar"
        title="OntologyX UI Studio · Semantic V2"
        subtitle="Author IR → resolver → canonical UI"
        actions={
          <Row gap="sm" align="center">
            <Badge tone="warning">experimental</Badge>
            <Button size="sm" variant="quiet" onClick={() => updateStudioView('catalog')}>
              Catalog
            </Button>
          </Row>
        }
      />
      <StudioEnvironmentToolbar />
      <ScrollView className="ui-studio-workspace-scroll" ariaLabel="Semantic V2 workbench">
        <Box className="ui-studio-workspace-content">
          <Stack gap="xl">
            <Surface
              material="glass"
              elevation={1}
              radius="lg"
              className="ui-studio-semantic-intro"
            >
              <Stack gap="sm">
                <Row gap="sm" align="center">
                  <Badge tone="accent">V2-04</Badge>
                  <Label emphasis="strong">Semantic inspection + AI actionability</Label>
                </Row>
                <Text tone="secondary" wrap="pretty">
                  The runtime exposes one bounded semantic inspection snapshot for focus, selection
                  and available commands. AI/automation invokes stable command identities through
                  the host registry without scraping DOM nodes or gaining business authority.
                </Text>
                <Row gap="sm" className="ui-studio-semantic-facts">
                  <Badge>container: {runtime.environment.container}</Badge>
                  <Badge>input: {runtime.environment.modality}</Badge>
                  <Badge>density: {runtime.environment.density}</Badge>
                  <Badge>direction: {runtime.environment.direction}</Badge>
                  <Badge>pointer: {runtime.environment.pointerPrecision}</Badge>
                  <Badge tone={runtime.diagnostics.length ? 'danger' : 'success'}>
                    diagnostics: {runtime.diagnostics.length}
                  </Badge>
                </Row>
              </Stack>
            </Surface>

            <Grid
              columns="auto-fit"
              minColumn="wide"
              gap="md"
              className="ui-studio-semantic-json-grid"
            >
              <JsonPanel id="author" title="Author IR" value={semanticFixture} />
              <JsonPanel id="runtime" title="Runtime IR" value={runtime} />
              <JsonPanel id="inspection" title="Inspection" value={inspection} />
            </Grid>

            <Surface
              material="glass"
              elevation={1}
              radius="lg"
              className="ui-studio-semantic-preview"
            >
              <Stack gap="lg">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">
                    Canonical rendering
                  </Label>
                  <Heading level={2} size="title">
                    Live semantic preview
                  </Heading>
                  <Text tone="tertiary" wrap="pretty">
                    Change the Studio environment above. Compact/touch resolution deliberately
                    overrides soft presentation preferences.
                  </Text>
                </Stack>

                {commandGroup?.kind === 'command-group' ? (
                  <SemanticCommandGroup node={commandGroup} registry={commands} context={context} />
                ) : null}

                {form?.kind === 'form' ? (
                  <SemanticForm node={form} bindings={bindings} context={context} />
                ) : null}

                {workspace?.kind === 'workspace' ? (
                  <SemanticWorkspace
                    node={workspace}
                    renderContent={(semanticId, role) => {
                      const node = runtimeNode(semanticId);
                      if (node?.kind === 'collection') {
                        return (
                          <SemanticCollection
                            node={node}
                            commands={commands}
                            bindings={bindings}
                            context={context}
                            label={role === 'sidebar' ? 'File places' : 'Current files'}
                            onSemanticFocusChange={
                              semanticId === 'studio.recent-files' ? setInspectionFocus : undefined
                            }
                          />
                        );
                      }
                      if (node?.kind === 'form') {
                        return <SemanticForm node={node} bindings={bindings} context={context} />;
                      }
                      return null;
                    }}
                  />
                ) : null}

                <Row gap="sm" align="center">
                  <Badge>selected: {selectedFiles.length}</Badge>
                  <Badge>target: {lastTarget}</Badge>
                  <Badge>focus: {inspection.focus?.item ?? inspection.focus?.node ?? 'none'}</Badge>
                </Row>

                <Surface material="subtle" radius="md" data-studio-semantic-ai-actions>
                  <Stack gap="sm">
                    <Label emphasis="strong">AI / automation actionability</Label>
                    <Text tone="secondary" wrap="pretty">
                      This control invokes the focused semantic action through the inspection
                      snapshot. The caller supplies no DOM selector, item target or selection
                      payload.
                    </Text>
                    <Row gap="sm" align="center">
                      <Button
                        variant="secondary"
                        disabled={!focusedOpenAction?.invocable}
                        data-studio-semantic-ai-invoke="file.open"
                        onClick={() => {
                          void invokeUiInspectionCommand(inspection, commands, context, {
                            command: 'file.open',
                            sourceNode: 'studio.recent-files',
                            scope: 'focused-item',
                          }).then((result) => setInspectionStatus(result.status));
                        }}
                      >
                        Invoke focused Open
                      </Button>
                      <Badge data-studio-semantic-ai-status>{inspectionStatus}</Badge>
                    </Row>
                  </Stack>
                </Surface>

                <Row gap="sm" align="center">
                  <Button variant="secondary" onClick={() => setConfirmationOpen(true)}>
                    Open semantic confirmation
                  </Button>
                  <Text tone="secondary">
                    Last command: <Code>{lastCommand}</Code>
                  </Text>
                </Row>

                {confirmation?.kind === 'confirmation' ? (
                  <SemanticConfirmation
                    node={confirmation}
                    registry={commands}
                    context={context}
                    open={confirmationOpen}
                    onOpenChange={setConfirmationOpen}
                  />
                ) : null}
              </Stack>
            </Surface>
          </Stack>
        </Box>
      </ScrollView>
    </Box>
  );
}

function resolveSemanticFixture(context: FixtureContext, environment: UiResolverEnvironment) {
  return importSemanticResolver(context, environment);
}

function importSemanticResolver(context: FixtureContext, environment: UiResolverEnvironment) {
  // Kept as a named local boundary so the fixture makes the resolution step explicit in source/inspection.
  return resolveUiDefinition(semanticFixture, commands, context, {
    bindings,
    sources,
    environment,
  });
}
