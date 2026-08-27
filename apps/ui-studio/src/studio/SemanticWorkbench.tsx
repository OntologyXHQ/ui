import {
  AppBar,
  Badge,
  Box,
  Button,
  Code,
  createUiBindingRegistry,
  createUiCommandRegistry,
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
} from '@ontologyx/ui';
import { SemanticCommandGroup, SemanticConfirmation, SemanticForm } from '@ontologyx/ui/advanced';
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
      ],
      presentation: { preferred: 'inline' },
    }),
    ui.form({
      id: 'studio.settings-form',
      title: 'Semantic settings',
      description: 'Values are host-owned; Author IR contains only stable binding/source IDs.',
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
          description: 'A bounded options source rendered through the preferred canonical control.',
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

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <Surface material="subtle" radius="lg" className="ui-studio-semantic-panel">
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

  const runtime = resolveUiDefinition(semanticFixture, commands, context, { bindings, sources });
  const commandGroup = runtime.nodes.find((node) => node.kind === 'command-group');
  const form = runtime.nodes.find((node) => node.kind === 'form');
  const collection = runtime.nodes.find((node) => node.kind === 'collection');
  const confirmation = runtime.nodes.find((node) => node.kind === 'confirmation');

  return (
    <Box as="main" className="ui-studio-semantic-shell" data-studio-semantic-workbench>
      <AppBar
        className="ui-studio-appbar"
        title="OntologyX UI Studio · Semantic V2"
        subtitle="Author IR → registries → Runtime IR → canonical UI"
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
                  <Badge tone="accent">V2-01</Badge>
                  <Label emphasis="strong">First real semantic fixture</Label>
                </Row>
                <Text tone="secondary" wrap="pretty">
                  Author IR contains stable semantic references only. Host registries own values,
                  bounded sources and executable behavior. Runtime IR is the serializable resolved
                  snapshot consumed by canonical V1 components.
                </Text>
                <Row gap="sm" className="ui-studio-semantic-facts">
                  <Badge>theme: {environment.theme}</Badge>
                  <Badge>direction: {environment.direction}</Badge>
                  <Badge>density: {environment.density}</Badge>
                  <Badge tone={runtime.diagnostics.length ? 'danger' : 'success'}>
                    diagnostics: {runtime.diagnostics.length}
                  </Badge>
                  {collection?.kind === 'collection' ? (
                    <Badge>source items: {collection.sourceState.itemCount ?? 0}</Badge>
                  ) : null}
                </Row>
                <Text tone="tertiary" wrap="pretty">
                  Studio environment still styles and drives the accepted V1 runtime. Semantic
                  environment-based presentation resolution intentionally starts in V2-02.
                </Text>
              </Stack>
            </Surface>

            <Grid
              columns="auto-fit"
              minColumn="wide"
              gap="md"
              className="ui-studio-semantic-json-grid"
            >
              <JsonPanel title="Author IR" value={semanticFixture} />
              <JsonPanel title="Runtime IR" value={runtime} />
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
                    Edit host-owned values below. The Author IR remains unchanged while Runtime IR
                    reflects the latest resolved values.
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
