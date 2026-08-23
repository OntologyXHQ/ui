import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
  ReplaceTransition,
  SharedBounds,
  Row,
  ScaleTransition,
  ScrollView,
  Slider,
  SlideTransition,
  Stack,
  Surface,
  Switch,
  SystemApplicationBrowser,
  SystemBar,
  SystemCommandSurface,
  SystemDock,
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
import { OxMarkGlyph } from '@ontologyx/ui/icons';
import {
  DEMO_WORKSPACES,
  createInitialDemoWindowManagerState,
  demoDefaultBoundsFor,
  demoWindowManagerReducer,
  type DemoWindowBounds,
  type DemoWindowInstance,
  type DemoWorkspaceId,
} from './window-manager';
import '@ontologyx/ui/styles.css';
import './demo.css';

type DemoPanel = 'none' | 'quick' | 'notifications';
type SettingsSection = 'appearance' | 'network' | 'software';

type HostApplication = SystemApplicationItem & {
  accent: string;
  kind: 'browser' | 'files' | 'editor' | 'terminal' | 'photos' | 'music' | 'settings';
  /** Host policy. New-window is the default; single-instance is an explicit app exception. */
  launchPolicy?: 'new-window' | 'single-instance';
};

function hostIcon(letter: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="64" height="64" rx="17" fill="url(#g)"/><circle cx="21" cy="19" r="10" fill="rgba(255,255,255,.14)"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,sans-serif" font-size="29" font-weight="760" fill="white">${letter}</text></svg>`;
  return { src: `data:image/svg+xml,${encodeURIComponent(svg)}` } as const;
}

function HostApplicationIcon({ app, className = '' }: { app: HostApplication; className?: string }) {
  if (typeof app.icon === 'string') return <Icon name={app.kind === 'editor' ? 'editor' : app.kind} className={className} />;
  return <img className={className} src={app.icon.src} alt="" />;
}

// This array stands in for an OXS App/Package Registry result. The UI SDK only renders it.
const HOST_APPLICATIONS: readonly HostApplication[] = [
  { id: 'browser', name: 'Orbit', kind: 'browser', accent: '#6d7cff', icon: hostIcon('O', '#6375ff', '#884fff'), keywords: ['web', 'internet'], description: 'Browse the web' },
  { id: 'files', name: 'Files', kind: 'files', accent: '#3ba9ff', icon: hostIcon('F', '#2aa7ff', '#2360ff'), keywords: ['folders', 'storage'], description: 'Local and remote files' },
  { id: 'editor', name: 'Editor', kind: 'editor', accent: '#16c79a', icon: hostIcon('E', '#1cd3a3', '#067e79'), keywords: ['text', 'code'], description: 'Notes and source' },
  { id: 'terminal', name: 'Terminal', kind: 'terminal', accent: '#a0aec0', icon: hostIcon('T', '#566071', '#171d2a'), keywords: ['shell', 'command'], description: 'System shell' },
  { id: 'photos', name: 'Photos', kind: 'photos', accent: '#ff7f76', icon: hostIcon('P', '#ff8c76', '#f14b9a'), keywords: ['images', 'gallery'], description: 'Photo library' },
  { id: 'music', name: 'Music', kind: 'music', accent: '#ff5f8f', icon: hostIcon('M', '#ff5d8f', '#9c4dff'), keywords: ['audio', 'playback'], description: 'Now playing' },
  { id: 'settings', name: 'Settings', kind: 'settings', accent: '#8b96a8', icon: hostIcon('S', '#8b96a8', '#465166'), keywords: ['system', 'preferences'], description: 'System preferences', launchPolicy: 'single-instance' },
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
  { id: 'open-overview', label: 'Open window overview', description: 'See open windows and move between workspaces.' },
  { id: 'next-workspace', label: 'Next workspace', description: 'Move focus to the next logical workspace.' },
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
  return (
    <Text variant="caption" tone="secondary">
      {new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(now)}
    </Text>
  );
}

type DesktopContentProps = {
  active: HostApplication;
  darkAppearance: boolean;
  onDarkAppearanceChange: (checked: boolean) => void;
  animateWorkspace: boolean;
  onAnimateWorkspaceChange: (checked: boolean) => void;
  interfaceScale: number;
  onInterfaceScaleChange: (value: number) => void;
  wifi: boolean;
  onWifiChange: (checked: boolean) => void;
  bluetooth: boolean;
  onBluetoothChange: (checked: boolean) => void;
};

function SettingsContent({
  section,
  darkAppearance,
  onDarkAppearanceChange,
  animateWorkspace,
  onAnimateWorkspaceChange,
  interfaceScale,
  onInterfaceScaleChange,
  wifi,
  onWifiChange,
  bluetooth,
  onBluetoothChange,
}: Omit<DesktopContentProps, 'active'> & { section: SettingsSection }) {
  if (section === 'network') {
    return (
      <Stack gap="lg" className="demo-settings-page">
        <Stack gap="xs" className="demo-settings-page__intro">
          <Label tone="accent" emphasis="strong">Connectivity</Label>
          <Heading level={2} size="heading">Network & wireless</Heading>
          <Text tone="secondary" wrap="pretty">Manage the connections available to this desktop.</Text>
        </Stack>
        <div className="demo-settings-grid">
          <Card title="Wireless" description="Available to this desktop session" padding="md">
            <Stack gap="md">
              <Switch label="Wi-Fi" description={wifi ? 'Connected · Studio 5G' : 'Off'} checked={wifi} onCheckedChange={onWifiChange} />
              <Switch label="Bluetooth" description={bluetooth ? 'On · 2 devices nearby' : 'Off'} checked={bluetooth} onCheckedChange={onBluetoothChange} />
            </Stack>
          </Card>
          <Card title="Connection" description="Current route" padding="md">
            <Stack gap="sm">
              <Row justify="between"><Text tone="secondary">Status</Text><Badge tone={wifi ? 'success' : 'neutral'}>{wifi ? 'Online' : 'Offline'}</Badge></Row>
              <Row justify="between"><Text tone="secondary">Network</Text><Text>Studio 5G</Text></Row>
              <Row justify="between"><Text tone="secondary">Private address</Text><Text>Enabled</Text></Row>
            </Stack>
          </Card>
        </div>
      </Stack>
    );
  }

  if (section === 'software') {
    return (
      <Stack gap="lg" className="demo-settings-page">
        <Stack gap="xs" className="demo-settings-page__intro">
          <Label tone="accent" emphasis="strong">System</Label>
          <Heading level={2} size="heading">Software updates</Heading>
          <Text tone="secondary" wrap="pretty">Your system is up to date and ready to use.</Text>
        </Stack>
        <Card title="OntologyX System" description="Stable channel" padding="md" leading={<Icon name="software" size="lg" />}>
          <Stack gap="md">
            <Row justify="between" align="center"><Stack gap="3xs"><Text variant="body-strong">Version 1.0</Text><Text variant="caption" tone="secondary">Checked a few moments ago</Text></Stack><Badge tone="success">Up to date</Badge></Row>
            <Progress label="System integrity" value={100} max={100} />
            <Row gap="sm"><Button variant="primary">Check again</Button><Button variant="secondary">Release notes</Button></Row>
          </Stack>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" className="demo-settings-page">
      <Stack gap="xs" className="demo-settings-page__intro">
        <Label tone="accent" emphasis="strong">Personalization</Label>
        <Heading level={2} size="heading">Appearance & motion</Heading>
        <Text tone="secondary" wrap="pretty">Choose how OXS looks and moves across this desktop.</Text>
      </Stack>
      <div className="demo-settings-grid">
        <Card title="Appearance" description="Theme and animation preferences" padding="md">
          <Stack gap="md">
            <Switch label="Use dark appearance" description="Use the darker desktop and application appearance" checked={darkAppearance} onCheckedChange={onDarkAppearanceChange} />
            <Switch label="Animate workspace transitions" description="Show smooth transitions between desktop spaces" checked={animateWorkspace} onCheckedChange={onAnimateWorkspaceChange} />
          </Stack>
        </Card>
        <Card title="Interface scale" description={`${interfaceScale}%`} padding="md">
          <Slider label="Interface scale" min={80} max={140} value={interfaceScale} onValueChange={onInterfaceScaleChange} marks={[{ value: 80, label: '80%' }, { value: 100, label: '100%' }, { value: 140, label: '140%' }]} />
        </Card>
      </div>
    </Stack>
  );
}

function DesktopContent(props: DesktopContentProps) {
  const { active } = props;
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('appearance');

  if (active.kind === 'settings') {
    return (
      <SystemSettingsLayout
        className="demo-settings"
        title="Settings"
        subtitle="System preferences"
        sections={SETTINGS_SECTIONS}
        value={settingsSection}
        onValueChange={(value) => setSettingsSection(value as SettingsSection)}
        actions={<Badge tone="neutral">OXS 1.0</Badge>}
      >
        <ReplaceTransition key={settingsSection} present spring="expressive" className="demo-settings-transition">
          <SettingsContent section={settingsSection} {...props} />
        </ReplaceTransition>
      </SystemSettingsLayout>
    );
  }

  return (
    <Stack gap="lg" className="demo-app-content">
      <Row gap="md" align="center" className="demo-app-hero">
        <HostApplicationIcon app={active} className="demo-app-content__icon" />
        <Stack gap="3xs">
          <Heading level={2} size="heading">{active.name}</Heading>
          <Text tone="secondary">{active.description}</Text>
        </Stack>
      </Row>
      {active.kind === 'terminal' ? (
        <Surface material="solid" radius="lg" className="demo-terminal">
          <Code as="samp" wrap="normal">{`l@oxs ~ $ systemctl --user status ontologyx-shell\n● ontologyx-shell.service — active (running)\n\nl@oxs ~ $ _`}</Code>
        </Surface>
      ) : active.kind === 'files' ? (
        <Card title="Recent" description="Continue where you left off" padding="md" className="demo-content-card">
          <List label="Recent files" divided>
            <ListItem primary="UI Platform" secondary="Projects / OntologyX" metadata="Folder" />
            <ListItem primary="release-notes.md" secondary="Documents" metadata="18 KB" />
            <ListItem primary="system-demo.fig" secondary="Design" metadata="4.2 MB" />
          </List>
        </Card>
      ) : active.kind === 'music' ? (
        <Card title="Night Drive" description="OntologyX Radio" padding="lg" leading={<Icon name="music" size="lg" />} className="demo-content-card">
          <Stack gap="md">
            <Progress label="Playback" value={63} max={100} />
            <Row gap="sm"><Button variant="secondary">Previous</Button><Button variant="primary">Pause</Button><Button variant="secondary">Next</Button></Row>
          </Stack>
        </Card>
      ) : active.kind === 'photos' ? (
        <Grid columns="auto-fit" minColumn="tile" gap="sm" aria-label="Photo collection" className="demo-photo-grid">
          {['Dawn', 'City', 'Forest', 'Sea', 'Night', 'Studio'].map((name, index) => (
            <Surface key={name} radius="lg" className="demo-photo" data-tone={index % 3}><Text variant="caption">{name}</Text></Surface>
          ))}
        </Grid>
      ) : active.kind === 'editor' ? (
        <Card title="release-notes.md" description="Saved · Markdown" padding="lg" className="demo-content-card">
          <Stack gap="sm"><Heading level={3} size="heading">OXS 1.0 release notes</Heading><Text tone="secondary" wrap="pretty">A calmer desktop, faster workspace navigation and a consistent set of controls across system applications.</Text><Code>status: ready</Code></Stack>
        </Card>
      ) : (
        <Stack gap="md">
          <Surface material="subtle" radius="lg" className="demo-browser-bar"><Icon name="browser" /><Text tone="tertiary">ontologyx.dev/ui</Text></Surface>
          <Card title="Welcome to OXS" description="A focused desktop that keeps applications, workspaces and system controls within reach." padding="lg" className="demo-content-card">
            <Grid columns="auto-fit" minColumn="tile" gap="sm">
              <Surface material="subtle" radius="md" className="demo-stat"><Icon name="apps" /><Text variant="body-strong">Applications</Text><Text tone="secondary">Launch and return to work quickly</Text></Surface>
              <Surface material="subtle" radius="md" className="demo-stat"><Icon name="browser" /><Text variant="body-strong">Workspaces</Text><Text tone="secondary">Keep tasks separated without losing context</Text></Surface>
              <Surface material="subtle" radius="md" className="demo-stat"><Icon name="settings" /><Text variant="body-strong">Controls</Text><Text tone="secondary">Adjust the system without leaving your flow</Text></Surface>
            </Grid>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}

type DemoWindowDrag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  origin: DemoWindowBounds;
};

type LauncherDrag = {
  pointerId: number;
  startY: number;
};

function nextWorkspaceId(workspaceId: DemoWorkspaceId): DemoWorkspaceId {
  const index = DEMO_WORKSPACES.indexOf(workspaceId);
  return DEMO_WORKSPACES[(index + 1) % DEMO_WORKSPACES.length];
}

function appById(id: string): HostApplication {
  return HOST_APPLICATIONS.find((app) => app.id === id) ?? HOST_APPLICATIONS[0];
}

function OverviewCard({
  window,
  app,
  focused,
  onActivate,
  onClose,
  onMoveToWorkspace,
}: {
  window: DemoWindowInstance;
  app: HostApplication;
  focused: boolean;
  onActivate: () => void;
  onClose: () => void;
  onMoveToWorkspace: () => void;
}) {
  const dragRef = useRef<{ pointerId: number; startY: number } | null>(null);
  const [dragY, setDragY] = useState(0);

  const finishSwipe = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    dragRef.current = null;
    if (delta < -84) onClose();
    setDragY(0);
  };

  return (
    <article
      className="demo-overview-card"
      data-focused={focused || undefined}
      data-minimized={window.minimized || undefined}
      data-demo-overview-window={window.id}
      style={{ '--demo-recents-drag-y': `${dragY}px` } as React.CSSProperties}
      onPointerDown={(event) => {
        if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
        dragRef.current = { pointerId: event.pointerId, startY: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        setDragY(Math.min(18, event.clientY - drag.startY));
      }}
      onPointerUp={finishSwipe}
      onPointerCancel={(event) => {
        if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
        setDragY(0);
      }}
    >
      <button type="button" className="demo-overview-card__preview" onClick={onActivate}>
        <div className="demo-overview-card__titlebar">
          <HostApplicationIcon app={app} className="demo-overview-card__app-icon" />
          <span>{app.name}</span>
          {window.minimized ? <span className="demo-overview-card__state">minimized</span> : null}
        </div>
        <div className="demo-overview-card__fake-content" data-kind={app.kind} aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </button>
      <Row gap="xs" className="demo-overview-card__actions">
        <Button size="sm" variant="secondary" onClick={onActivate}>Focus</Button>
        <Button size="sm" variant="quiet" onClick={onMoveToWorkspace}>Move →</Button>
        <Button size="sm" variant="quiet" intent="destructive" onClick={onClose}>Close</Button>
      </Row>
    </article>
  );
}

function DemoDesktop() {
  // Demo host simulation only: @ontologyx/ui renders the scene, while window/workspace policy stays host-owned.
  const [windowManager, dispatchWindow] = useReducer(
    demoWindowManagerReducer,
    undefined,
    createInitialDemoWindowManagerState,
  );
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherQuery, setLauncherQuery] = useState('');
  const [launcherDragOffset, setLauncherDragOffset] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [panel, setPanel] = useState<DemoPanel>('none');
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(true);
  const [volume, setVolume] = useState(68);
  const [osdVisible, setOsdVisible] = useState(false);
  const [darkAppearance, setDarkAppearance] = useState(true);
  const [animateWorkspace, setAnimateWorkspace] = useState(true);
  const [interfaceScale, setInterfaceScale] = useState(100);
  const workspaceStageRef = useRef<HTMLDivElement>(null);
  const windowDragRef = useRef<DemoWindowDrag | null>(null);
  const launcherDragRef = useRef<LauncherDrag | null>(null);

  const focusedWindow = useMemo(
    () => windowManager.windows.find((window) => window.id === windowManager.focusedWindowId) ?? null,
    [windowManager.focusedWindowId, windowManager.windows],
  );
  const activeApp = focusedWindow ? appById(focusedWindow.appId) : null;

  const launchApplication = useCallback((appId: string) => {
    const app = appById(appId);
    const policy = app.launchPolicy ?? 'new-window';
    if (policy === 'single-instance') {
      const existing = [...windowManager.windows]
        .filter((window) => window.appId === appId && !window.closing)
        .sort((a, b) => b.z - a.z)[0];
      if (existing) {
        dispatchWindow({ type: 'restore', id: existing.id });
        setOverviewOpen(false);
        setPanel('none');
        return existing.id;
      }
    }
    const bounds = demoDefaultBoundsFor(
      windowManager,
      windowManager.activeWorkspaceId,
      appId,
    );
    dispatchWindow({
      type: 'open',
      appId,
      workspaceId: windowManager.activeWorkspaceId,
      bounds,
    });
    setOverviewOpen(false);
    setPanel('none');
    return null;
  }, [windowManager]);

  const activatePinnedApplication = useCallback((appId: string) => {
    const existing = [...windowManager.windows]
      .filter(
        (window) =>
          window.appId === appId &&
          window.workspaceId === windowManager.activeWorkspaceId &&
          !window.closing,
      )
      .sort((a, b) => b.z - a.z)[0];
    if (existing) {
      dispatchWindow({ type: 'restore', id: existing.id });
      return;
    }
    launchApplication(appId);
  }, [launchApplication, windowManager]);

  const switchWorkspace = useCallback((workspaceId: DemoWorkspaceId) => {
    dispatchWindow({ type: 'switch-workspace', workspaceId });
    setPanel('none');
    setLauncherOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        setLauncherOpen(true);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      } else if (event.ctrlKey && event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        switchWorkspace(nextWorkspaceId(windowManager.activeWorkspaceId));
      } else if (event.ctrlKey && event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        const index = DEMO_WORKSPACES.indexOf(windowManager.activeWorkspaceId);
        switchWorkspace(DEMO_WORKSPACES[(index - 1 + DEMO_WORKSPACES.length) % DEMO_WORKSPACES.length]);
      } else if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        dispatchWindow({ type: 'cycle-focus', direction: 1 });
      } else if (event.key === 'Escape') {
        setLauncherOpen(false);
        setOverviewOpen(false);
        setPanel('none');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [switchWorkspace, windowManager.activeWorkspaceId]);

  useEffect(() => {
    if (!launcherOpen) return;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLInputElement>('.demo-launcher input[data-autofocus]')?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [launcherOpen]);

  useEffect(() => {
    if (!osdVisible) return;
    const timer = window.setTimeout(() => setOsdVisible(false), 1_250);
    return () => window.clearTimeout(timer);
  }, [osdVisible, volume]);

  const quickSections = [
    { id: 'network', title: 'Connectivity', description: wifi ? 'Studio 5G · online' : 'Wireless disabled', content: <Stack gap="sm"><Switch label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} /><Switch label="Bluetooth" checked={bluetooth} onCheckedChange={setBluetooth} /></Stack> },
    { id: 'sound', title: 'Sound', description: `${volume}% output volume`, content: <Slider label="Output volume" value={volume} onValueChange={(value) => { setVolume(value); setOsdVisible(true); }} min={0} max={100} /> },
  ];

  const runCommand = (id: string) => {
    setCommandOpen(false);
    setCommandQuery('');
    if (id === 'open-apps') setLauncherOpen(true);
    if (id === 'open-settings') launchApplication('settings');
    if (id === 'toggle-quick') setPanel((current) => current === 'quick' ? 'none' : 'quick');
    if (id === 'toggle-notifications') setPanel((current) => current === 'notifications' ? 'none' : 'notifications');
    if (id === 'open-overview') setOverviewOpen(true);
    if (id === 'next-workspace') switchWorkspace(nextWorkspaceId(windowManager.activeWorkspaceId));
  };

  const startWindowDrag = (event: React.PointerEvent<HTMLDivElement>, window: DemoWindowInstance) => {
    if (
      event.button !== 0 ||
      window.mode === 'maximized' ||
      overviewOpen ||
      (event.target as HTMLElement).closest('button')
    ) return;
    dispatchWindow({ type: 'focus', id: window.id });
    windowDragRef.current = {
      id: window.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: window.bounds,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveWindowDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = windowDragRef.current;
    const stage = workspaceStageRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    dispatchWindow({
      type: 'move',
      id: drag.id,
      bounds: {
        ...drag.origin,
        x: drag.origin.x + (event.clientX - drag.startX) / rect.width,
        y: drag.origin.y + (event.clientY - drag.startY) / rect.height,
      },
    });
  };

  const finishWindowDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (windowDragRef.current?.pointerId === event.pointerId) windowDragRef.current = null;
  };

  const topBar = (
    <SystemBar
      className="demo-system-bar"
      density="compact"
      label="System status bar"
      leading={
        <Button
          size="sm"
          variant="quiet"
          className="demo-system-home"
          onClick={() => setLauncherOpen(true)}
          leading={<Icon glyph={OxMarkGlyph} size="sm" />}
        >
          Applications
        </Button>
      }
      center={
        <Row gap="sm" align="center" className="demo-system-bar__center-stack">
          <Clock />
          <div className="demo-workspace-switcher" role="group" aria-label="Workspaces">
            {DEMO_WORKSPACES.map((workspaceId) => (
              <Button
                key={workspaceId}
                size="sm"
                variant={workspaceId === windowManager.activeWorkspaceId ? 'secondary' : 'quiet'}
                aria-label={`Switch to workspace ${workspaceId}`}
                onClick={() => switchWorkspace(workspaceId)}
              >
                {workspaceId}
              </Button>
            ))}
          </div>
        </Row>
      }
      trailing={<Row gap="2xs"><IconButton size="sm" icon="apps" label="Window overview" pressed={overviewOpen} onPressedChange={() => setOverviewOpen((current) => !current)} /><IconButton size="sm" icon="search" label="Open command palette" onClick={() => setCommandOpen(true)} /><IconButton size="sm" icon="browser" label="Quick settings" pressed={panel === 'quick'} onPressedChange={() => setPanel((current) => current === 'quick' ? 'none' : 'quick')} /><IconButton size="sm" icon="software" label="Notifications" pressed={panel === 'notifications'} onPressedChange={() => setPanel((current) => current === 'notifications' ? 'none' : 'notifications')} /></Row>}
    />
  );

  const dockApplications = ['browser', 'files', 'editor', 'terminal', 'settings'] as const;
  const dock = (
    <SystemDock className="demo-dock" label="Application dock">
      <IconButton icon="apps" label="Window overview" pressed={overviewOpen} onPressedChange={() => setOverviewOpen((current) => !current)} />
      <span className="demo-dock__separator" aria-hidden />
      {dockApplications.map((appId) => {
        const running = windowManager.windows.filter((window) => window.appId === appId && !window.closing).length;
        const focused = focusedWindow?.appId === appId;
        const app = appById(appId);
        return (
          <span
            key={appId}
            className="demo-dock-app"
            data-running={running > 0 || undefined}
            data-focused={focused || undefined}
            data-count={running || undefined}
          >
            <Button
              className="demo-dock-app__button"
              size="md"
              variant="quiet"
              aria-label={`${running ? 'Focus or restore' : 'Open'} ${app.name}`}
              leading={<HostApplicationIcon app={app} className="demo-dock-app__icon" />}
              onClick={() => activatePinnedApplication(appId)}
            >
              {app.name}
            </Button>
            {running > 1 ? <span className="demo-dock-app__count" aria-hidden>{running}</span> : null}
          </span>
        );
      })}
    </SystemDock>
  );

  const sidePanel = panel === 'quick' ? (
    <SlideTransition key="quick" present direction="inline-end" spring="expressive" distance={18}>
      <SystemPanel className="demo-side-panel" title="Quick Settings" subtitle="Network, sound and devices" edge="inline-end" width="md">
        <SystemQuickSettings title="Controls" sections={quickSections} />
      </SystemPanel>
    </SlideTransition>
  ) : panel === 'notifications' ? (
    <SlideTransition key="notifications" present direction="inline-end" spring="expressive" distance={18}>
      <SystemPanel className="demo-side-panel" title="Notifications" subtitle="Recent activity" edge="inline-end" width="md">
        <SystemNotificationCenter items={NOTIFICATIONS} onActivate={() => setPanel('none')} />
      </SystemPanel>
    </SlideTransition>
  ) : undefined;

  const renderWindow = (window: DemoWindowInstance) => {
    const app = appById(window.appId);
    const focused = window.id === windowManager.focusedWindowId;
    const style = window.mode === 'maximized'
      ? ({ zIndex: window.z, inset: 0 } as React.CSSProperties)
      : ({
          zIndex: window.z,
          left: `${window.bounds.x * 100}%`,
          top: `${window.bounds.y * 100}%`,
          width: `${window.bounds.width * 100}%`,
          height: `${window.bounds.height * 100}%`,
        } as React.CSSProperties);
    const contentProps: DesktopContentProps = {
      active: app,
      darkAppearance,
      onDarkAppearanceChange: setDarkAppearance,
      animateWorkspace,
      onAnimateWorkspaceChange: setAnimateWorkspace,
      interfaceScale,
      onInterfaceScaleChange: setInterfaceScale,
      wifi,
      onWifiChange: setWifi,
      bluetooth,
      onBluetoothChange: setBluetooth,
    };

    return (
      <div
        key={window.id}
        className="demo-window-frame"
        style={style}
        data-demo-window-id={window.id}
        data-active-app={app.id}
        data-focused={focused || undefined}
        data-maximized={window.mode === 'maximized' || undefined}
      >
        <SharedBounds
          className="demo-window-bounds"
          transitionId={`demo-window-${window.id}`}
          layoutKey={`${window.mode}:${window.workspaceId}:${overviewOpen ? 'overview' : 'desktop'}`}
        >
          <ScaleTransition
            present={!window.minimized && !window.closing}
            spring="expressive"
            className="demo-window-presence"
            onRest={(present) => {
              if (!present && window.closing) dispatchWindow({ type: 'commit-close', id: window.id });
            }}
          >
            <div
              className="demo-window"
              onPointerDown={() => dispatchWindow({ type: 'focus', id: window.id })}
            >
            <div
              className="demo-window__titlebar"
              data-drag-handle
              onDoubleClick={() => dispatchWindow({ type: 'toggle-maximize', id: window.id })}
              onPointerDown={(event) => startWindowDrag(event, window)}
              onPointerMove={moveWindowDrag}
              onPointerUp={finishWindowDrag}
              onPointerCancel={finishWindowDrag}
            >
              <Row gap="sm" align="center" className="demo-window__identity">
                <HostApplicationIcon app={app} className="demo-window__app-icon" />
                <Stack gap="3xs">
                  <Label emphasis="strong">{app.name}</Label>
                  <Text variant="caption" tone="tertiary">Workspace {window.workspaceId}</Text>
                </Stack>
              </Row>
              <Row gap="3xs" className="demo-window__controls">
                <Button className="demo-window-control" size="sm" variant="quiet" aria-label={`Minimize ${app.name}`} onClick={() => dispatchWindow({ type: 'minimize', id: window.id })}>−</Button>
                <Button className="demo-window-control" size="sm" variant="quiet" aria-label={`${window.mode === 'maximized' ? 'Restore' : 'Maximize'} ${app.name}`} onClick={() => dispatchWindow({ type: 'toggle-maximize', id: window.id })}>{window.mode === 'maximized' ? '❐' : '□'}</Button>
                <Button className="demo-window-control demo-window-control--close" size="sm" variant="quiet" intent="destructive" aria-label={`Close ${app.name}`} onClick={() => dispatchWindow({ type: 'request-close', id: window.id })}>×</Button>
              </Row>
            </div>
            <ScrollView className="demo-window__scroll" ariaLabel={`${app.name} window content`}>
              <DesktopContent {...contentProps} />
              </ScrollView>
            </div>
          </ScaleTransition>
        </SharedBounds>
      </div>
    );
  };

  const workspace = (
    <SystemWorkspace
      className="demo-workspace"
      title={`Workspace ${windowManager.activeWorkspaceId}`}
      status={activeApp ? `${activeApp.name} focused` : 'No focused window'}
      label="OXS desktop workspace"
    >
      <div className="demo-wallpaper" aria-label="Demo desktop">
        <div className="demo-desktop-status" aria-hidden>
          <span>Workspace {windowManager.activeWorkspaceId}</span>
          <span>{windowManager.windows.filter((window) => window.workspaceId === windowManager.activeWorkspaceId && !window.closing).length} windows</span>
        </div>
        <div
          ref={workspaceStageRef}
          className="demo-workspace-stage"
          data-overview={overviewOpen || undefined}
          aria-hidden={overviewOpen || undefined}
          inert={overviewOpen || undefined}
        >
          {DEMO_WORKSPACES.map((workspaceId) => {
            const offset = workspaceId - windowManager.activeWorkspaceId;
            const workspaceWindows = windowManager.windows.filter((window) => window.workspaceId === workspaceId);
            return (
              <div
                key={workspaceId}
                className="demo-workspace-scene"
                data-workspace-id={workspaceId}
                data-active={workspaceId === windowManager.activeWorkspaceId || undefined}
                aria-hidden={workspaceId !== windowManager.activeWorkspaceId || undefined}
                inert={workspaceId !== windowManager.activeWorkspaceId || undefined}
                style={{ transform: `translate3d(${offset * 106}%, 0, 0)` }}
              >
                {workspaceWindows.map(renderWindow)}
              </div>
            );
          })}
        </div>
      </div>
    </SystemWorkspace>
  );

  const overviewWindows = [...windowManager.windows]
    .filter(
      (window) =>
        window.workspaceId === windowManager.activeWorkspaceId && !window.closing,
    )
    .sort((a, b) => b.z - a.z);

  const overview = (
    <ScaleTransition present={overviewOpen} spring="expressive" className="demo-overview-layer">
      <section role="dialog" aria-modal="true" aria-label="Window overview" className="demo-overview">
        <div className="demo-overview__header">
          <Stack gap="3xs">
            <Label tone="accent" emphasis="strong">Overview</Label>
            <Heading level={2} size="heading">Workspace {windowManager.activeWorkspaceId}</Heading>
            <Text tone="secondary">Choose a workspace or return to an open window.</Text>
          </Stack>
          <Button variant="secondary" onClick={() => setOverviewOpen(false)}>Done</Button>
        </div>
        <div className="demo-overview-workspaces" role="group" aria-label="Workspace overview">
          {DEMO_WORKSPACES.map((workspaceId) => {
            const windows = windowManager.windows.filter(
              (window) => window.workspaceId === workspaceId && !window.closing,
            );
            return (
              <button
                key={workspaceId}
                type="button"
                className="demo-workspace-thumbnail"
                data-active={workspaceId === windowManager.activeWorkspaceId || undefined}
                aria-label={`Show workspace ${workspaceId}`}
                onClick={() => switchWorkspace(workspaceId)}
              >
                <span className="demo-workspace-thumbnail__number">{workspaceId}</span>
                <span className="demo-workspace-thumbnail__scene" aria-hidden>
                  {windows.slice(0, 4).map((window, index) => (
                    <span key={window.id} style={{ transform: `translate(${index * 8}px, ${index * 5}px)` }} />
                  ))}
                </span>
                <span className="demo-workspace-thumbnail__count">{windows.length}</span>
              </button>
            );
          })}
        </div>
        <ReplaceTransition key={windowManager.activeWorkspaceId} present spring="expressive" className="demo-overview-recents-transition">
          <div className="demo-overview-recents" aria-label={`Recent windows in workspace ${windowManager.activeWorkspaceId}`}>
            {overviewWindows.length ? overviewWindows.map((window) => {
              const app = appById(window.appId);
              return (
                <OverviewCard
                  key={window.id}
                  window={window}
                  app={app}
                  focused={window.id === windowManager.focusedWindowId}
                  onActivate={() => {
                    dispatchWindow({ type: 'restore', id: window.id });
                    setOverviewOpen(false);
                  }}
                  onClose={() => dispatchWindow({ type: 'request-close', id: window.id })}
                  onMoveToWorkspace={() => dispatchWindow({ type: 'move-to-workspace', id: window.id, workspaceId: nextWorkspaceId(window.workspaceId) })}
                />
              );
            }) : (
              <Surface material="subtle" radius="lg" className="demo-overview-empty">
                <Stack gap="sm" align="center"><Heading level={3} size="heading">Empty workspace</Heading><Text tone="secondary">Launch an app here or choose another workspace.</Text><Button variant="primary" onClick={() => { setOverviewOpen(false); setLauncherOpen(true); }}>Open launcher</Button></Stack>
              </Surface>
            )}
          </div>
        </ReplaceTransition>
      </section>
    </ScaleTransition>
  );

  const launcher = (
    <ScaleTransition present={launcherOpen} spring="expressive" className="demo-launcher-layer" onRest={(present) => { if (!present) setLauncherDragOffset(0); }}>
      <section role="dialog" aria-modal="true" aria-label="Application launcher" className="demo-launcher-shell">
        <button type="button" className="demo-launcher__scrim" aria-label="Close application launcher" onClick={() => setLauncherOpen(false)} />
        <div
          className="demo-launcher-motion"
          data-dragging={launcherDragRef.current !== null || undefined}
          style={{ transform: `translate3d(0, ${launcherDragOffset}px, 0)` }}
        >
          <Surface material="solid" radius="xl" className="demo-launcher">
          <button
            type="button"
            className="demo-launcher__handle"
            aria-label="Drag launcher down to dismiss"
            onClick={() => setLauncherOpen(false)}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              launcherDragRef.current = { pointerId: event.pointerId, startY: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const drag = launcherDragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              setLauncherDragOffset(Math.max(0, event.clientY - drag.startY));
            }}
            onPointerUp={(event) => {
              const drag = launcherDragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              const delta = Math.max(0, event.clientY - drag.startY);
              launcherDragRef.current = null;
              if (delta > 86) setLauncherOpen(false);
              else setLauncherDragOffset(0);
            }}
            onPointerCancel={() => {
              launcherDragRef.current = null;
              setLauncherDragOffset(0);
            }}
          >
            <span aria-hidden />
          </button>
          <SystemApplicationBrowser
            className="demo-launcher__browser"
            title="Applications"
            subtitle={`Workspace ${windowManager.activeWorkspaceId} · Search or open an application`}
            query={launcherQuery}
            apps={HOST_APPLICATIONS}
            onQueryChange={setLauncherQuery}
            onActivate={(id) => {
              launchApplication(id);
              setLauncherOpen(false);
              setLauncherQuery('');
            }}
            interactive={launcherOpen}
          />
          </Surface>
        </div>
      </section>
    </ScaleTransition>
  );

  return (
    <UiRoot
      theme={darkAppearance ? 'dark' : 'light'}
      density="comfortable"
      motion={animateWorkspace ? 'full' : 'reduced'}
      className="demo-root"
      instrumentPerformance
      style={{ '--demo-interface-scale': String(interfaceScale / 100) } as React.CSSProperties}
    >
      <DesktopShellLayout
        className="demo-shell"
        workspace={workspace}
        topBar={topBar}
        dock={dock}
        panel={sidePanel}
        transient={<>{osdVisible ? <SystemOsd label="Output volume" value={volume} tone="accent" icon={<Icon name="music" />} /> : null}{overview}{launcher}</>}
      />
      <SystemCommandSurface open={commandOpen} query={commandQuery} commands={COMMANDS} onQueryChange={setCommandQuery} onActivate={runCommand} onOpenChange={setCommandOpen} />
    </UiRoot>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('OntologyX UI demo root element was not found.');
ReactDOM.createRoot(root).render(<React.StrictMode><DemoDesktop /></React.StrictMode>);
