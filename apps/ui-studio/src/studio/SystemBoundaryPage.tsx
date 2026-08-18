import {
  Badge,
  Button,
  Card,
  Heading,
  Label,
  List,
  ListItem,
  Row,
  ScrollView,
  Stack,
  StatusIndicator,
  SystemLauncher,
  SystemScaffold,
  SystemSurface,
  SystemWorkspace,
  Text,
  UiRoot,
} from '@ontologyx/ui';
import { useMemo, useState } from 'react';
import { StudioNav } from './StudioNav';

const roadmap = [
  ['UIP13', 'Studio self-hosting', 'Studio chrome migrates to the same @ontologyx/ui it documents.'],
  ['UIP15', 'System touch keyboard', 'Privileged System surface composed from Components.'],
  ['UIP16', 'Text input + IME', 'Native authority, secure input, physical keyboard policy and occlusion.'],
  ['UIP17', 'System cursor', 'Roles, theme, scale, hotspot and pointer-alignment acceptance.'],
  ['UIP23', 'V1 closeout', 'Self-hosting + System-only ownership + real privileged-input acceptance.'],
] as const;

export function SystemBoundaryPage() {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [query, setQuery] = useState('');
  const apps = useMemo(
    () => [
      { id: 'browser', name: 'Browser', icon: 'browser' as const, keywords: ['web'] },
      { id: 'files', name: 'Files', icon: 'files' as const, keywords: ['folders'] },
      { id: 'terminal', name: 'Terminal', icon: 'terminal' as const, keywords: ['shell'] },
    ].filter((app) => `${app.name} ${app.id} ${app.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OntologyX UI System boundary">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="system" />

            <section className="ui-studio-hero ui-system-boundary-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP11</Label>
                  <Label tone="tertiary">System UI · ownership boundary</Label>
                </Row>
                <Heading level={1} size="display">System UI begins above the Component floor.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Launcher and Workspace are now OXS System compositions. Their visible controls come from public Components; System code no longer imports Primitives, legacy Patterns or shared runtime internals.
                </Text>
              </Stack>
            </section>

            <section className="ui-system-boundary-grid">
              <Card
                title="System → Components only"
                description="The boundary is enforced by the same stable pnpm quality contract."
                emphasis="strong"
                actions={<StatusIndicator label="Boundary active" tone="success" />}
              >
                <List label="System ownership rules" divided>
                  <ListItem primary="SystemScaffold" secondary="Workspace, chrome, transient and privileged slots" metadata={<Badge>System</Badge>} />
                  <ListItem primary="SystemLauncher" secondary="Search + application presentation composed from Components" metadata={<Badge>System</Badge>} />
                  <ListItem primary="SystemWorkspace" secondary="Visual workspace host; compositor/WM authority stays native" metadata={<Badge>System</Badge>} />
                </List>
              </Card>

              <Card
                title="Privileged input stays privileged"
                description="The future keyboard uses this System boundary; it is not an application widget."
              >
                <Stack gap="sm">
                  <Text tone="secondary" wrap="pretty">
                    UIP15 keyboard surface is complete; UIP16 integrates text-input/IME/secure-input/physical-keyboard policy and occlusion, and UIP17 completes cursor ownership.
                  </Text>
                  <SystemSurface kind="privileged" edge="block-end" occludesContent label="Privileged keyboard host preview">
                    <Card padding="sm" title="Reserved keyboard host" description="Lifecycle comes from the compositor/native input stack." />
                  </SystemSurface>
                </Stack>
              </Card>
            </section>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">System scaffold</Label>
                  <Heading level={2} size="title">OXS-specific slots without lower-layer bypass</Heading>
                  <Text tone="secondary" wrap="pretty">The preview uses real SystemScaffold/SystemWorkspace exports; chrome and privileged regions are classified separately.</Text>
                </Stack>
                <div className="ui-system-boundary-preview">
                  <SystemScaffold
                    insets={{ blockStart: 10, blockEnd: 18 }}
                    workspace={<SystemWorkspace title="OXS" status="Studio preview" />}
                    chrome={
                      <SystemSurface kind="chrome" edge="block-start" label="Preview system chrome">
                        <Card padding="sm" title="System chrome" description="System placement + Component visuals" />
                      </SystemSurface>
                    }
                    privileged={
                      <SystemSurface kind="privileged" edge="block-end" occludesContent label="Preview privileged surface">
                        <Card padding="sm" title="Future keyboard surface" description="Occlusion metadata is explicit." />
                      </SystemSurface>
                    }
                  />
                </div>
              </Stack>
            </section>

            <section className="ui-system-boundary-grid">
              <Card
                title="Migrated Launcher"
                description="Open the real SystemLauncher implementation."
                actions={<Button onClick={() => setLauncherOpen(true)}>Open Launcher</Button>}
              >
                <Text tone="secondary">Search, sheet, application tiles, scrolling and empty states are all Component-owned below SystemLauncher.</Text>
              </Card>

              <Card title="Roadmap now continues to UIP23" description="UIP14 is a hardening checkpoint, not V1 closeout.">
                <List label="Extended UI roadmap" divided>
                  {roadmap.map(([id, title, description]) => (
                    <ListItem key={id} primary={`${id} · ${title}`} secondary={description} />
                  ))}
                </List>
              </Card>
            </section>
          </Stack>
        </ScrollView>

        <SystemLauncher
          open={launcherOpen}
          query={query}
          apps={apps}
          onQueryChange={setQuery}
          onLaunch={() => false}
          onClose={() => setLauncherOpen(false)}
        />
      </main>
    </UiRoot>
  );
}
