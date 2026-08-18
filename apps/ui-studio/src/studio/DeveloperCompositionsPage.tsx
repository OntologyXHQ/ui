import {
  Accordion,
  ApplicationItem,
  Badge,
  Button,
  Card,
  ContentState,
  Heading,
  Icon,
  Label,
  List,
  ListItem,
  PageScaffold,
  Row,
  ScrollView,
  Stack,
  StatusIndicator,
  Text,
  Tile,
  TileGrid,
  UiRoot,
} from '@oxs/ui';
import { useState } from 'react';
import { StudioNav } from './StudioNav';

const accordionItems = [
  {
    value: 'appearance',
    summary: 'Appearance',
    description: 'Theme, density and typography',
    content: 'Developer-level composition only. Product settings state stays outside the component.',
  },
  {
    value: 'interaction',
    summary: 'Interaction',
    description: 'Pointer, keyboard and motion',
    content: 'The composition reuses native disclosure semantics instead of creating another interaction engine.',
  },
] as const;

export function DeveloperCompositionsPage() {
  const [selectedApp, setSelectedApp] = useState('browser');
  const [state, setState] = useState<'empty' | 'error' | 'loading'>('empty');

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS UI developer compositions">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="compositions" />

            <section className="ui-studio-hero ui-compositions-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP10</Label>
                  <Label tone="tertiary">Components · developer compositions</Label>
                </Row>
                <Heading level={1} size="display">The reusable SDK closes before System UI begins.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Cards, disclosures, application scaffolds, tile collections, content states and the public ScrollView facade
                  now give higher layers enough generic structure without reaching down into Primitives or runtime services.
                </Text>
              </Stack>
            </section>

            <section className="ui-compositions-grid">
              <Card
                title="Card composition"
                description="One reusable owner for heading, actions, content and footer regions."
                actions={<Button size="sm" variant="soft">Action</Button>}
                footer={<Text tone="tertiary">Product state and copy remain caller-owned.</Text>}
                emphasis="strong"
              >
                <Text tone="secondary" wrap="pretty">
                  This replaces repeated Surface + Row + Stack assembly without inventing feature semantics.
                </Text>
              </Card>

              <Card title="Disclosure + Accordion" description="Native disclosure semantics, coordinated when needed.">
                <Accordion label="Composition settings" defaultValue={['appearance']} items={accordionItems} />
              </Card>
            </section>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Generic application structure</Label>
                  <Heading level={2} size="title">PageScaffold adapts from stacked to split layout</Heading>
                  <Text tone="secondary" wrap="pretty">Resize the Studio: the sidebar changes from stacked flow to a logical start rail from container width, not device identity.</Text>
                </Stack>
                <PageScaffold
                  className="ui-compositions-scaffold-demo"
                  header={<Card padding="sm" title="Preferences" description="Generic application header slot" actions={<Button size="sm">Save</Button>} />}
                  sidebar={
                    <List label="Settings sections">
                      <ListItem primary="General" secondary="Language and appearance" selected onActivate={() => {}} />
                      <ListItem primary="Interaction" secondary="Keyboard and pointer" onActivate={() => {}} />
                      <ListItem primary="Advanced" secondary="Developer options" onActivate={() => {}} />
                    </List>
                  }
                  footer={<span>Footer/status slot · safe for ordinary application composition</span>}
                  contentLabel="Page scaffold preview"
                  contentRole="region"
                >
                  <Stack gap="md">
                    <Card title="Main content" description="System UI may consume this scaffold; it does not own OXS workspace semantics.">
                      <Text tone="secondary">Settings rows already come from reusable ListItem; no System-level primitive workaround is needed.</Text>
                    </Card>
                    <Card title="Nested scroll facade" description="The public Component delegates to the shared scroll runtime.">
                      <ScrollView className="ui-compositions-mini-scroll" ariaLabel="Nested developer scroll" indicator="always">
                        <Stack gap="xs">
                          {Array.from({ length: 7 }, (_, index) => (
                            <div className="ui-compositions-scroll-row" key={index}>Scrollable row {index + 1}</div>
                          ))}
                        </Stack>
                      </ScrollView>
                    </Card>
                  </Stack>
                </PageScaffold>
              </Stack>
            </section>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Reusable tile collection</Label>
                  <Heading level={2} size="title">Application identity is generic; Launcher behavior is not</Heading>
                  <Text tone="secondary" wrap="pretty">ApplicationItem owns reusable identity/action state. Search, launch policy, sheet lifecycle and launcher layout remain for System UI.</Text>
                </Stack>
                <TileGrid label="Application collection">
                  <ApplicationItem name="Browser" icon="browser" selected={selectedApp === 'browser'} onActivate={() => setSelectedApp('browser')} badge={<Badge tone="accent">2</Badge>} />
                  <ApplicationItem name="Files" icon="files" selected={selectedApp === 'files'} onActivate={() => setSelectedApp('files')} trailing={<StatusIndicator label="Running" tone="success" showLabel={false} />} />
                  <ApplicationItem name="Terminal" icon="terminal" selected={selectedApp === 'terminal'} onActivate={() => setSelectedApp('terminal')} />
                  <Tile title="Generic tile" description="Works outside app launchers" leading={<Icon name="settings" />} trailing={<Badge>SDK</Badge>} />
                </TileGrid>
              </Stack>
            </section>

            <section className="ui-compositions-grid">
              <Card title="Content state family" description="Empty, error and loading use one replacement-state composition.">
                <Row gap="sm" className="ui-compositions-state-switcher">
                  <Button size="sm" variant={state === 'empty' ? 'filled' : 'ghost'} onClick={() => setState('empty')}>Empty</Button>
                  <Button size="sm" variant={state === 'error' ? 'filled' : 'ghost'} onClick={() => setState('error')}>Error</Button>
                  <Button size="sm" variant={state === 'loading' ? 'filled' : 'ghost'} onClick={() => setState('loading')}>Loading</Button>
                </Row>
                <ContentState
                  kind={state}
                  icon={state === 'empty' ? <Icon name="search" size="lg" /> : state === 'error' ? <Icon name="close" size="lg" /> : undefined}
                  title={state === 'empty' ? 'No results' : state === 'error' ? 'Could not load' : 'Loading content'}
                  description={state === 'empty' ? 'The caller owns filters and recovery copy.' : state === 'error' ? 'Error policy remains outside the visual composition.' : 'Shared status semantics, no product-specific progress policy.'}
                  actions={state === 'loading' ? undefined : <Button size="sm">{state === 'error' ? 'Retry' : 'Clear filters'}</Button>}
                />
              </Card>

              <DirectionMatrix />
            </section>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}

function DirectionMatrix() {
  return (
    <Card title="Direction + coarse-pointer matrix" description="Same Composition API across environment axes.">
      <div className="ui-compositions-direction-grid">
        <UiRoot scope="nested" direction="ltr" modality="touch" pointerPrecision="coarse">
          <TileGrid density="compact" label="LTR composition preview">
            <ApplicationItem name="Files" icon="files" onActivate={() => {}} />
            <Tile title="Settings" description="Logical order" leading={<Icon name="settings" />} />
          </TileGrid>
        </UiRoot>
        <UiRoot scope="nested" direction="rtl" modality="touch" pointerPrecision="coarse">
          <TileGrid density="compact" label="RTL composition preview">
            <ApplicationItem name="فایل‌ها" icon="files" onActivate={() => {}} />
            <Tile title="تنظیمات" description="چیدمان منطقی" leading={<Icon name="settings" />} />
          </TileGrid>
        </UiRoot>
      </div>
    </Card>
  );
}
