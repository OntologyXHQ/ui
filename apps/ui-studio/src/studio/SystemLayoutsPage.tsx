import {
  Badge,
  Button,
  Card,
  DesktopShellLayout,
  Heading,
  Label,
  Row,
  ScrollView,
  Slider,
  Stack,
  StatusIndicator,
  Switch,
  SystemApplicationBrowser,
  SystemBar,
  SystemChromeGroup,
  SystemCommandSurface,
  SystemDock,
  SystemKeyboardHost,
  SystemLockLayout,
  SystemNotificationCenter,
  SystemOsd,
  SystemPanel,
  SystemQuickSettings,
  SystemSettingsLayout,
  SystemWorkspace,
  Text,
  UiRoot,
} from '@oxs/ui';
import { useMemo, useState } from 'react';
import { StudioNav } from './StudioNav';

const applications = [
  { id: 'browser', name: 'Browser', icon: 'browser' as const, description: 'Web and installed experiences', keywords: ['web'] },
  { id: 'files', name: 'Files', icon: 'files' as const, description: 'Local and connected storage', keywords: ['folders'] },
  { id: 'terminal', name: 'Terminal', icon: 'terminal' as const, description: 'Shell and developer tools', keywords: ['shell'] },
  { id: 'settings', name: 'Settings', icon: 'settings' as const, description: 'System preferences', keywords: ['preferences'] },
] as const;

export function SystemLayoutsPage() {
  const [query, setQuery] = useState('');
  const [presentation, setPresentation] = useState<'grid' | 'list'>('grid');
  const [settingsSection, setSettingsSection] = useState('display');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const apps = useMemo(
    () => applications.filter((app) => `${app.name} ${app.description} ${app.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const commands = useMemo(
    () => [
      { id: 'settings', label: 'Open settings', description: 'System configuration', shortcut: 'Ctrl+,' },
      { id: 'lock', label: 'Lock session', description: 'Return to the secure lock surface', shortcut: 'Super+L' },
      { id: 'launcher', label: 'Open launcher', description: 'Browse installed applications', shortcut: 'Super' },
    ].filter((command) => `${command.label} ${command.description}`.toLowerCase().includes(commandQuery.toLowerCase())),
    [commandQuery],
  );

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS System layout library">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="layouts" />

            <section className="ui-studio-hero ui-system-layouts-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP12</Label>
                  <Label tone="tertiary">System UI · layout vocabulary</Label>
                </Row>
                <Heading level={1} size="display">The shell now has one System layout language.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Desktop chrome, application browsing, Settings, notification/quick settings and privileged/transient hosts are OXS System compositions built only from the frozen public Component floor. Native WM, notification, auth and IME authority remains outside React.
                </Text>
              </Stack>
            </section>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">DesktopShellLayout</Label>
                  <Heading level={2} size="title">Workspace + chrome + dock + panel</Heading>
                  <Text tone="secondary" wrap="pretty">Resize the Studio window: shell slots remain logical, safe-area aware and container-driven.</Text>
                </Stack>
                <div className="ui-system-layouts-desktop-preview">
                  <DesktopShellLayout
                    workspace={<SystemWorkspace title="OXS" status="Nested output"><div className="ui-system-layouts-native-scene">Native compositor scene</div></SystemWorkspace>}
                    topBar={
                      <SystemBar
                        label="System status bar"
                        leading={<SystemChromeGroup label="Session"><StatusIndicator label="Online" tone="success" /></SystemChromeGroup>}
                        center={<Badge tone="accent">OXS</Badge>}
                        trailing={<SystemChromeGroup label="Clock"><Text>13:15</Text></SystemChromeGroup>}
                      />
                    }
                    dock={
                      <SystemDock>
                        <Button size="sm">Apps</Button>
                        <Button size="sm">Browser</Button>
                        <Button size="sm">Files</Button>
                      </SystemDock>
                    }
                    panel={
                      <SystemPanel title="System status" subtitle="Component-owned content" width="sm">
                        <Stack gap="sm">
                          <StatusIndicator label="Network ready" tone="success" />
                          <StatusIndicator label="Updates available" tone="warning" />
                          <Switch label="Do not disturb" />
                        </Stack>
                      </SystemPanel>
                    }
                  />
                </div>
              </Stack>
            </section>

            <section className="ui-system-layouts-grid">
              <Card
                title="Application browser"
                description="The same layout can drive Launcher grid/list presentation."
                actions={
                  <Row gap="2xs">
                    <Button size="sm" variant={presentation === 'grid' ? 'filled' : 'ghost'} onClick={() => setPresentation('grid')}>Grid</Button>
                    <Button size="sm" variant={presentation === 'list' ? 'filled' : 'ghost'} onClick={() => setPresentation('list')}>List</Button>
                  </Row>
                }
              >
                <div className="ui-system-layouts-browser-preview">
                  <SystemApplicationBrowser
                    query={query}
                    apps={apps}
                    presentation={presentation}
                    onQueryChange={setQuery}
                    onActivate={() => {}}
                  />
                </div>
              </Card>

              <Card title="Settings" description="Adaptive navigation switches between compact and split layouts through container space.">
                <div className="ui-system-layouts-settings-preview">
                  <SystemSettingsLayout
                    title="System settings"
                    sections={[
                      { value: 'display', label: 'Display' },
                      { value: 'input', label: 'Input' },
                      { value: 'privacy', label: 'Privacy' },
                    ]}
                    value={settingsSection}
                    onValueChange={setSettingsSection}
                  >
                    <Stack gap="sm">
                      <Card title="Current section" description={settingsSection} padding="sm">
                        <Switch label="Example preference" defaultChecked />
                      </Card>
                      <Card title="Scale" padding="sm"><Slider label="Scale" defaultValue={100} min={80} max={150} /></Card>
                    </Stack>
                  </SystemSettingsLayout>
                </div>
              </Card>
            </section>

            <section className="ui-system-layouts-grid">
              <Card title="Notification center" description="View-model only; delivery and persistence remain backend-owned.">
                <SystemNotificationCenter
                  items={[
                    { id: 'sync', title: 'Sync complete', body: 'Project files are up to date.', metadata: 'now', unread: true },
                    { id: 'update', title: 'Update ready', body: 'Restart when convenient.', metadata: '12m' },
                  ]}
                  actions={<Button size="sm" variant="ghost">Clear</Button>}
                />
              </Card>

              <Card title="Quick settings" description="System state presented through public Switch/Slider Components.">
                <SystemQuickSettings
                  sections={[
                    { id: 'wireless', title: 'Wireless', description: 'Connectivity', content: <Switch label="Wi-Fi" defaultChecked /> },
                    { id: 'audio', title: 'Audio', description: 'Output level', content: <Slider label="Volume" defaultValue={64} /> },
                    { id: 'focus', title: 'Focus', description: 'Interruptions', content: <Switch label="Do not disturb" /> },
                    { id: 'brightness', title: 'Display', description: 'Brightness', content: <Slider label="Brightness" defaultValue={72} /> },
                  ]}
                />
              </Card>
            </section>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Transient + privileged</Label>
                  <Heading level={2} size="title">UI hosts without stealing backend authority</Heading>
                </Stack>
                <div className="ui-system-layouts-transient-grid">
                  <div className="ui-system-layouts-osd-preview">
                    <SystemOsd label="Volume" value={64} tone="accent" status="Speakers" />
                  </div>
                  <SystemLockLayout
                    primary="13:15"
                    secondary="Tuesday, August 18"
                    identity={<Badge tone="accent">MR</Badge>}
                    authentication={<Button variant="filled">Unlock</Button>}
                    status={<StatusIndicator label="Secure session" tone="success" />}
                  />
                  <SystemKeyboardHost
                    state={{
                      surfaceId: 'studio-layout-keyboard',
                      sessionId: 'studio-layout-keyboard-session',
                      visible: true,
                      language: 'en',
                      layout: 'letters',
                      contentPurpose: 'text',
                      secure: false,
                    }}
                    onCommand={() => undefined}
                  />
                </div>
                <Row gap="sm">
                  <Button onClick={() => setCommandOpen(true)}>Open command surface</Button>
                  <StatusIndicator label="System→Components only" tone="success" />
                </Row>
              </Stack>
            </section>

            <section className="ui-system-layouts-direction-grid">
              {(['ltr', 'rtl'] as const).map((direction) => (
                <UiRoot key={direction} scope="nested" direction={direction} modality="touch" pointerPrecision="coarse">
                  <Card title={`${direction.toUpperCase()} · coarse pointer`} description="Logical edges and Component hit targets use the same layout implementation.">
                    <SystemBar
                      label={`${direction} system bar`}
                      leading={<Button size="sm">Start</Button>}
                      center={<Badge>{direction}</Badge>}
                      trailing={<Button size="sm">End</Button>}
                    />
                  </Card>
                </UiRoot>
              ))}
            </section>
          </Stack>
        </ScrollView>

        <SystemCommandSurface
          open={commandOpen}
          query={commandQuery}
          commands={commands}
          onQueryChange={setCommandQuery}
          onActivate={() => setCommandOpen(false)}
          onOpenChange={setCommandOpen}
        />
      </main>
    </UiRoot>
  );
}
