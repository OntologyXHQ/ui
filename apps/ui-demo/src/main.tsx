import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Badge,
  Button,
  Card,
  Code,
  DesktopShellLayout,
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
  Slider,
  Stack,
  Surface,
  Switch,
  SystemBar,
  SystemCommandSurface,
  SystemDock,
  SystemLauncher,
  SystemNotificationCenter,
  SystemOsd,
  SystemPanel,
  SystemQuickSettings,
  SystemSettingsLayout,
  SystemWorkspace,
  Text,
  UiRoot,
  type NavigationItem,
  type SystemApplicationItem,
  type SystemCommandItem,
  type SystemNotificationItem,
} from '@ontologyx/ui';
import '@ontologyx/ui/styles.css';
import './demo.css';

type DemoPanel = 'none' | 'quick' | 'notifications';

type HostApplication = SystemApplicationItem & {
  accent: string;
  kind: 'browser' | 'files' | 'editor' | 'terminal' | 'photos' | 'music' | 'settings';
};

function hostIcon(letter: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="64" height="64" rx="17" fill="url(#g)"/><circle cx="21" cy="19" r="10" fill="rgba(255,255,255,.14)"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,sans-serif" font-size="29" font-weight="760" fill="white">${letter}</text></svg>`;
  return { src: `data:image/svg+xml,${encodeURIComponent(svg)}` } as const;
}

// This array stands in for an OXS App/Package Registry result. The UI SDK only renders it.
const HOST_APPLICATIONS: readonly HostApplication[] = [
  { id: 'browser', name: 'Orbit', kind: 'browser', accent: '#6d7cff', icon: hostIcon('O', '#6375ff', '#884fff'), keywords: ['web', 'internet'], description: 'Browse the web' },
  { id: 'files', name: 'Files', kind: 'files', accent: '#3ba9ff', icon: hostIcon('F', '#2aa7ff', '#2360ff'), keywords: ['folders', 'storage'], description: 'Local and remote files' },
  { id: 'editor', name: 'Editor', kind: 'editor', accent: '#16c79a', icon: hostIcon('E', '#1cd3a3', '#067e79'), keywords: ['text', 'code'], description: 'Notes and source' },
  { id: 'terminal', name: 'Terminal', kind: 'terminal', accent: '#a0aec0', icon: hostIcon('T', '#566071', '#171d2a'), keywords: ['shell', 'command'], description: 'System shell' },
  { id: 'photos', name: 'Photos', kind: 'photos', accent: '#ff7f76', icon: hostIcon('P', '#ff8c76', '#f14b9a'), keywords: ['images', 'gallery'], description: 'Photo library' },
  { id: 'music', name: 'Music', kind: 'music', accent: '#ff5f8f', icon: hostIcon('M', '#ff5d8f', '#9c4dff'), keywords: ['audio', 'playback'], description: 'Now playing' },
  { id: 'settings', name: 'Settings', kind: 'settings', accent: '#8b96a8', icon: hostIcon('S', '#8b96a8', '#465166'), keywords: ['system', 'preferences'], description: 'System preferences' },
] as const;

const NOTIFICATIONS: readonly SystemNotificationItem[] = [
  { id: 'sync', title: 'Cloud sync finished', body: '12 files are now available offline.', metadata: 'Now', unread: true },
  { id: 'meeting', title: 'Design review', body: 'UI platform review starts in 18 minutes.', metadata: 'Calendar', unread: true },
  { id: 'update', title: 'System update ready', body: 'Restart when you are ready to apply it.', metadata: 'System' },
] as const;

const COMMANDS: readonly SystemCommandItem[] = [
  { id: 'open-apps', label: 'Open application launcher', description: 'Browse apps from the host registry.', shortcut: 'Ctrl Space', ariaKeyShortcuts: 'Control+Space' },
  { id: 'open-settings', label: 'Open settings', description: 'Show the Settings application.' },
  { id: 'toggle-quick', label: 'Toggle quick settings', description: 'Open or close the System quick-settings panel.' },
  { id: 'toggle-notifications', label: 'Toggle notifications', description: 'Open or close Notification Center.' },
] as const;

const SETTINGS_SECTIONS: readonly NavigationItem[] = [
  { value: 'appearance', label: 'Appearance', icon: <Icon name="settings" /> },
  { value: 'network', label: 'Network', icon: <Icon name="browser" /> },
  { value: 'software', label: 'Software', icon: <Icon name="software" /> },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return <Text variant="caption" tone="secondary">{new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(now)}</Text>;
}

function DesktopContent({ active }: { active: HostApplication }) {
  const [settingsSection, setSettingsSection] = useState('appearance');
  if (active.kind === 'settings') {
    return (
      <SystemSettingsLayout
        className="demo-settings"
        title="Settings"
        subtitle="Host-owned preferences, UI-owned presentation"
        sections={SETTINGS_SECTIONS}
        value={settingsSection}
        onValueChange={setSettingsSection}
      >
        <Stack gap="lg" className="demo-settings__content">
          <Stack gap="2xs">
            <Label tone="accent" emphasis="strong">{settingsSection}</Label>
            <Heading level={2} size="title">System preferences</Heading>
            <Text tone="secondary" wrap="pretty">The demo owns these values. SystemSettingsLayout only owns reusable navigation and content geometry.</Text>
          </Stack>
          <Card title="Color & motion" description="A composed settings card using public controls." padding="md">
            <Stack gap="md">
              <Switch label="Use dark appearance" defaultChecked />
              <Switch label="Animate workspace transitions" defaultChecked />
              <Slider label="Interface scale" min={80} max={140} defaultValue={100} marks={[{ value: 80, label: '80%' }, { value: 100, label: '100%' }, { value: 140, label: '140%' }]} />
            </Stack>
          </Card>
        </Stack>
      </SystemSettingsLayout>
    );
  }

  return (
    <Stack gap="lg" className="demo-app-content">
      <Row gap="sm" align="center">
        <img className="demo-app-content__icon" src={typeof active.icon === 'string' ? '' : active.icon.src} alt="" />
        <Stack gap="3xs">
          <Label tone="accent" emphasis="strong">Running application</Label>
          <Heading level={2} size="title">{active.name}</Heading>
        </Stack>
      </Row>
      {active.kind === 'terminal' ? (
        <Surface material="solid" radius="lg" className="demo-terminal">
          <Code as="samp" wrap="normal">{`l@oxs ~ $ systemctl --user status ontologyx-shell\n● ontologyx-shell.service — active (running)\n\nl@oxs ~ $ _`}</Code>
        </Surface>
      ) : active.kind === 'files' ? (
        <List label="Recent files" divided>
          <ListItem primary="UI Platform" secondary="Projects / OntologyX" metadata="Folder" />
          <ListItem primary="release-notes.md" secondary="Documents" metadata="18 KB" />
          <ListItem primary="system-demo.fig" secondary="Design" metadata="4.2 MB" />
        </List>
      ) : active.kind === 'music' ? (
        <Card title="Night Drive" description="OntologyX Radio" padding="lg" leading={<Icon name="music" size="lg" />}>
          <Stack gap="md">
            <Progress label="Playback" value={63} max={100} />
            <Row gap="sm"><Button variant="secondary">Previous</Button><Button variant="primary">Pause</Button><Button variant="secondary">Next</Button></Row>
          </Stack>
        </Card>
      ) : active.kind === 'photos' ? (
        <Grid columns="auto-fit" minColumn="tile" gap="sm" aria-label="Photo collection">
          {['Dawn', 'City', 'Forest', 'Sea', 'Night', 'Studio'].map((name, index) => (
            <Surface key={name} radius="lg" className="demo-photo" data-tone={index % 3}><Text variant="caption" tone="secondary">{name}</Text></Surface>
          ))}
        </Grid>
      ) : active.kind === 'editor' ? (
        <Card title="release-notes.md" description="Saved · Markdown" padding="lg">
          <Stack gap="sm"><Heading level={3} size="heading">OntologyX UI 1.0</Heading><Text tone="secondary" wrap="pretty">A platform-neutral UI SDK with first-class environment, interaction, motion, System surfaces and evidence-backed acceptance.</Text><Code>pnpm dev</Code></Stack>
        </Card>
      ) : (
        <Stack gap="md">
          <Surface material="subtle" radius="lg" className="demo-browser-bar"><Text tone="tertiary">https://ontologyx.dev/ui</Text></Surface>
          <Card title="A UI platform, not a page kit" description="The browser window is demo-owned; the controls and System composition are public @ontologyx/ui." padding="lg">
            <Grid columns="auto-fit" minColumn="tile" gap="sm">
              <Surface material="subtle" radius="md" className="demo-stat"><Label tone="accent">100</Label><Text tone="secondary">public visual exports</Text></Surface>
              <Surface material="subtle" radius="md" className="demo-stat"><Label tone="accent">44</Label><Text tone="secondary">real-browser journeys</Text></Surface>
              <Surface material="subtle" radius="md" className="demo-stat"><Label tone="accent">V1</Label><Text tone="secondary">release candidate</Text></Surface>
            </Grid>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}

function DemoDesktop() {
  const [activeId, setActiveId] = useState('browser');
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherQuery, setLauncherQuery] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [panel, setPanel] = useState<DemoPanel>('none');
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(true);
  const [volume, setVolume] = useState(68);
  const [osdVisible, setOsdVisible] = useState(false);
  const active = useMemo(() => HOST_APPLICATIONS.find((app) => app.id === activeId) ?? HOST_APPLICATIONS[0], [activeId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        setLauncherOpen(true);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!osdVisible) return;
    const timer = window.setTimeout(() => setOsdVisible(false), 1_250);
    return () => window.clearTimeout(timer);
  }, [osdVisible, volume]);

  const quickSections = [
    { id: 'network', title: 'Connectivity', description: 'Host-owned radios and state', content: <Stack gap="sm"><Switch label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} /><Switch label="Bluetooth" checked={bluetooth} onCheckedChange={setBluetooth} /></Stack> },
    { id: 'sound', title: 'Sound', description: `${volume}% output volume`, content: <Slider label="Output volume" value={volume} onValueChange={(value) => { setVolume(value); setOsdVisible(true); }} min={0} max={100} /> },
  ];

  const runCommand = (id: string) => {
    setCommandOpen(false);
    setCommandQuery('');
    if (id === 'open-apps') setLauncherOpen(true);
    if (id === 'open-settings') setActiveId('settings');
    if (id === 'toggle-quick') setPanel((current) => current === 'quick' ? 'none' : 'quick');
    if (id === 'toggle-notifications') setPanel((current) => current === 'notifications' ? 'none' : 'notifications');
  };

  const topBar = (
    <SystemBar
      label="System status bar"
      leading={<Row gap="xs" align="center"><Button size="sm" variant="quiet" onClick={() => setLauncherOpen(true)} leading={<Icon name="apps" />}>OXS</Button><Badge tone="accent">Demo</Badge></Row>}
      center={<Clock />}
      trailing={<Row gap="2xs"><IconButton size="sm" icon="search" label="Open command palette" onClick={() => setCommandOpen(true)} /><IconButton size="sm" icon="browser" label="Quick settings" pressed={panel === 'quick'} onPressedChange={() => setPanel((current) => current === 'quick' ? 'none' : 'quick')} /><IconButton size="sm" icon="software" label="Notifications" pressed={panel === 'notifications'} onPressedChange={() => setPanel((current) => current === 'notifications' ? 'none' : 'notifications')} /></Row>}
    />
  );

  const dock = (
    <SystemDock label="Application dock">
      <IconButton icon="apps" label="Open launcher" onClick={() => setLauncherOpen(true)} />
      <IconButton icon="browser" label="Open Orbit" pressed={activeId === 'browser'} onClick={() => setActiveId('browser')} />
      <IconButton icon="files" label="Open Files" pressed={activeId === 'files'} onClick={() => setActiveId('files')} />
      <IconButton icon="terminal" label="Open Terminal" pressed={activeId === 'terminal'} onClick={() => setActiveId('terminal')} />
      <IconButton icon="settings" label="Open Settings" pressed={activeId === 'settings'} onClick={() => setActiveId('settings')} />
    </SystemDock>
  );

  const sidePanel = panel === 'quick' ? (
    <SystemPanel title="Control Center" subtitle="System state stays host-owned" edge="inline-end" width="md">
      <SystemQuickSettings title="Controls" sections={quickSections} />
    </SystemPanel>
  ) : panel === 'notifications' ? (
    <SystemPanel title="Activity" subtitle="Stable IDs, caller-owned delivery" edge="inline-end" width="md">
      <SystemNotificationCenter items={NOTIFICATIONS} onActivate={() => setPanel('none')} />
    </SystemPanel>
  ) : undefined;

  const workspace = (
    <SystemWorkspace title="Workspace 1" status={`${active.name} active`}>
      <div className="demo-wallpaper" aria-label="Demo desktop">
        <div className="demo-window" data-active-app={active.id}>
          <div className="demo-window__titlebar">
            <Row gap="sm" align="center"><img className="demo-window__app-icon" src={typeof active.icon === 'string' ? '' : active.icon.src} alt="" /><Label emphasis="strong">{active.name}</Label></Row>
            <Row gap="2xs"><span className="demo-window-dot" /><span className="demo-window-dot" /><span className="demo-window-dot demo-window-dot--close" /></Row>
          </div>
          <ScrollView className="demo-window__scroll" ariaLabel={`${active.name} window content`}>
            <DesktopContent active={active} />
          </ScrollView>
        </div>
        <Surface className="demo-registry-proof" material="glass" radius="lg" elevation={1}>
          <Stack gap="xs"><Row justify="between"><Label tone="accent" emphasis="strong">Host registry boundary</Label><Badge tone="success">outside UI</Badge></Row><Text variant="caption" tone="secondary" wrap="pretty">The demo resolves application IDs, names, image resources and launch policy. @ontologyx/ui only renders the supplied view models.</Text></Stack>
        </Surface>
      </div>
    </SystemWorkspace>
  );

  return (
    <UiRoot theme="dark" density="comfortable" motion="system" className="demo-root" instrumentPerformance>
      <DesktopShellLayout
        className="demo-shell"
        workspace={workspace}
        topBar={topBar}
        dock={dock}
        panel={sidePanel}
        transient={<>{osdVisible ? <SystemOsd label="Output volume" value={volume} tone="accent" icon={<Icon name="music" />} /> : null}<SystemLauncher open={launcherOpen} query={launcherQuery} apps={HOST_APPLICATIONS} onQueryChange={setLauncherQuery} onLaunch={(id) => { setActiveId(id); window.setTimeout(() => setLauncherOpen(false), 180); return true; }} onClose={() => { setLauncherOpen(false); setLauncherQuery(''); }} /></>}
      />
      <SystemCommandSurface open={commandOpen} query={commandQuery} commands={COMMANDS} onQueryChange={setCommandQuery} onActivate={runCommand} onOpenChange={setCommandOpen} />
    </UiRoot>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('OntologyX UI demo root element was not found.');
ReactDOM.createRoot(root).render(<React.StrictMode><DemoDesktop /></React.StrictMode>);
