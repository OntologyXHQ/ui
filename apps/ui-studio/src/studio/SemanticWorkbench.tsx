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
  Label,
  resolveUiDefinition,
  Row,
  ScrollView,
  Stack,
  Surface,
  Text,
  ui,
  type UiResolverContainer,
  type UiResolverEnvironment,
} from '@ontologyx/ui';
import {
  SemanticCommandGroup,
  SemanticConfirmation,
  SemanticForm,
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
  setLastCommand: (value: string) => void;
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
      id: 'studio.recent-files',
      source: 'files.recent',
      selection: { mode: 'multiple' },
      navigation: { mode: 'spatial' },
      commands: ['file.open'],
      presentation: { preferred: 'grid' },
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
    id: 'files.recent',
    kind: 'collection',
    read: () => [
      { id: 'readme', label: 'README.md' },
      { id: 'roadmap', label: 'ROADMAP.md' },
      { id: 'tokens', label: 'tokens.ts' },
    ],
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
    execute: ({ setLastCommand }) => setLastCommand('file.open'),
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
  const [lastCommand, setLastCommand] = useState('none');
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const context = useMemo<FixtureContext>(
    () => ({
      displayName,
      appearance,
      reducedMotion,
      setDisplayName,
      setAppearance,
      setReducedMotion,
      setLastCommand,
    }),
    [appearance, displayName, reducedMotion],
  );

  const resolverEnvironment = createUiResolverEnvironment({
    container: adaptiveContainer(environment),
    modality: resolvedEnvironment.modality,
    density: resolvedEnvironment.density,
    direction: resolvedEnvironment.direction,
    pointerPrecision: resolvedEnvironment.pointerPrecision,
  });
  const runtime = resolveSemanticFixture(context, resolverEnvironment);
  const commandGroup = runtime.nodes.find((node) => node.kind === 'command-group');
  const form = runtime.nodes.find((node) => node.kind === 'form');
  const confirmation = runtime.nodes.find((node) => node.kind === 'confirmation');

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
                  <Badge tone="accent">V2-02</Badge>
                  <Label emphasis="strong">Adaptive semantic runtime</Label>
                </Row>
                <Text tone="secondary" wrap="pretty">
                  Author IR contains stable semantic references only. The resolver consumes a
                  resolved host environment, places larger command sets deterministically and
                  projects canonical presentation without application-owned responsive branches.
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
