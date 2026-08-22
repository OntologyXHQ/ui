import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  DesktopShellLayout,
  Select,
  Slider,
  StatusIndicator,
  Switch,
  SystemApplicationBrowser,
  SystemBar,
  SystemChromeGroup,
  SystemCommandSurface,
  SystemDock,
  SystemKeyboardHost,
  SystemLauncher,
  SystemLockLayout,
  SystemNotificationCenter,
  SystemOsd,
  SystemPanel,
  SystemQuickSettings,
  SystemScaffold,
  SystemSettingsLayout,
  SystemSurface,
  SystemWorkspace,
  type SystemKeyboardCommand,
  type SystemKeyboardSurfaceState,
} from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'SystemScaffold',
    layer: 'system',
    category: 'Foundations',
    order: 10,
    summary:
      'OXS-specific slot host for workspace, chrome, transient and privileged System surfaces.',
    usage:
      'Use only in OXS System/Shell composition. Ordinary applications should use PageScaffold instead.',
    status: 'accepted',
    accessibility:
      'Preserves child landmarks and keeps privileged/transient layers structurally distinct; child surfaces own their interactive semantics.',
    rtl: 'Inset names and edge semantics are logical block/inline values.',
    touch: 'Does not create controls; System children retain Component-owned touch behavior.',
    responsive: 'Consumes logical safe-area/System inset values without device-name branching.',
    examples: [
      { id: 'boundary', title: 'System ownership boundary', component: 'SystemBoundaryExample' },
    ],
  },
  {
    exportName: 'SystemSurface',
    layer: 'system',
    category: 'Foundations',
    order: 10,
    summary:
      'System-only semantic wrapper for chrome, transient and privileged surfaces with explicit edge/occlusion metadata.',
    usage:
      'Use for OXS surface classification and compositor-facing layout semantics, not as a generic application Card/Panel replacement.',
    status: 'accepted',
    accessibility:
      'Optional labels describe grouped System regions while interactive children remain native Component controls.',
    rtl: 'Edges use logical block/inline naming so semantic start/end survive RTL.',
    touch: 'Surface classification does not alter child hit targets or invent hover behavior.',
    responsive: 'Edge and occlusion metadata are independent of viewport/device labels.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        kind: 'chrome',
        label: 'System chrome preview',
        children: 'System-owned surface content',
      },
    },
  },
  {
    exportName: 'SystemLauncher',
    layer: 'system',
    category: 'Surfaces',
    order: 20,
    summary:
      'OXS application-launcher surface backed by the shared SystemApplicationBrowser layout.',
    usage:
      'Shell owns launcher visibility/application lifecycle state and passes it here; application code should use generic search/tile/list Components instead.',
    status: 'accepted',
    accessibility:
      'Search, application activation, focus handling and sheet dismissal inherit shared Component semantics.',
    rtl: 'Search flow and application collection use logical Component layout; no Primitive-level directional workaround remains.',
    touch: 'Bottom-sheet, search and application actions use the shared touch/gesture/press stack.',
    responsive:
      'Application browser adapts by container while the launcher owns only System presentation.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        open: true,
        query: '',
        apps: [{ id: 'browser', name: 'Browser', icon: 'browser' }],
      },
    },
    examples: [{ id: 'launcher', title: 'System launcher', component: 'SystemLauncherExample' }],
  },
  {
    exportName: 'SystemWorkspace',
    layer: 'system',
    category: 'Surfaces',
    order: 20,
    summary:
      'OXS desktop/workspace visual composition separated from compositor/window-scene authority.',
    usage:
      'Use as the System-owned visual host around native workspace/window content; do not move WM/compositor authority into React.',
    status: 'accepted',
    accessibility:
      'Exposes a workspace landmark and reuses AppBar/StatusIndicator semantics for visible chrome.',
    rtl: 'System bar content follows logical Component layout.',
    touch:
      'Visible chrome consumes Component hit-target policy rather than feature-local controls.',
    responsive: 'Fills available output space and inherits System inset/safe-area contracts.',
    playground: {
      preferredWidth: 'wide',
      fixture: { title: 'OXS workspace', status: 'Ready', children: 'Workspace content' },
    },
  },
  {
    exportName: 'DesktopShellLayout',
    layer: 'system',
    category: 'Layouts',
    order: 30,
    summary:
      'Desktop shell layout that places workspace, system bars, dock, side panels, transient and privileged slots around one native scene.',
    usage:
      'Use as the top OXS desktop composition above SystemScaffold; keep window-management and output resize authority native.',
    status: 'accepted',
    accessibility:
      'Preserves the landmarks and labels owned by its child System/Component surfaces instead of inventing duplicate controls.',
    rtl: 'Panel/dock placement uses logical inline-start/inline-end edges.',
    touch: 'All actionable chrome is supplied by Components with the shared touch-target baseline.',
    responsive:
      'Container-aware slot CSS supports narrow nested development windows through ultrawide outputs without device detection.',
    examples: [
      {
        id: 'layout-library',
        title: 'Desktop System layout library',
        component: 'SystemLayoutLibraryExample',
      },
    ],
  },
  {
    exportName: 'SystemApplicationBrowser',
    layer: 'system',
    category: 'Layouts',
    order: 30,
    summary:
      'Reusable OXS application-browsing layout with System search/header and grid or list presentation.',
    usage:
      'Use inside Launcher or other OXS application surfaces; callers own application sourcing/ranking/routing while the layout applies only its deterministic text match to supplied view models.',
    status: 'accepted',
    accessibility:
      'Uses SearchField, ApplicationItem, List/TileGrid and ContentState semantics with one application-browser region label.',
    rtl: 'Search and collection layout stay logical; icons/actions keep Component-owned direction behavior.',
    touch: 'Application actions use Component press semantics and coarse-pointer hit targets.',
    responsive:
      'Header and collection reflow through container queries; presentation can be grid or list.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        query: '',
        apps: [
          { id: 'browser', name: 'Browser', icon: 'browser', description: 'Web application' },
          { id: 'files', name: 'Files', icon: 'files', description: 'Local files' },
        ],
      },
    },
    examples: [
      {
        id: 'application-browser',
        title: 'Caller-owned application browser',
        component: 'SystemApplicationBrowserExample',
      },
    ],
  },
  {
    exportName: 'SystemBar',
    layer: 'system',
    category: 'Chrome',
    order: 40,
    summary:
      'Logical block-start/block-end OXS system bar composed over the public Toolbar Component.',
    usage: 'Use for top/bottom shell status and action chrome; keep backend status data outside.',
    status: 'accepted',
    accessibility:
      'Toolbar semantics provide one labelled action region and preserve child control names.',
    rtl: 'Leading/center/trailing groups are logical and reverse naturally under RTL.',
    touch: 'Compact/comfortable density never bypasses Component touch targets.',
    responsive:
      'Groups wrap/collapse within their container instead of switching on named device classes.',
    playground: {
      preferredWidth: 'wide',
      fixture: { label: 'Top system bar', leading: 'Online', trailing: '12:42' },
    },
  },
  {
    exportName: 'SystemDock',
    layer: 'system',
    category: 'Chrome',
    order: 40,
    summary:
      'OXS dock placement for block-end or logical side edges using Component toolbar/actions.',
    usage:
      'Use for System-owned app/action dock placement; application launching and pinning policy remain outside.',
    status: 'accepted',
    accessibility:
      'One labelled toolbar groups dock actions and keeps individual action semantics intact.',
    rtl: 'Side placement uses inline-start/inline-end rather than physical left/right.',
    touch: 'Dock actions inherit Component hit targets and press behavior.',
    responsive:
      'Dock geometry can move between horizontal and vertical edges without changing action implementation.',
    playground: {
      preferredWidth: 'wide',
      fixture: { label: 'System dock', children: 'Application actions' },
    },
  },
  {
    exportName: 'SystemPanel',
    layer: 'system',
    category: 'Chrome',
    order: 40,
    summary: 'Nonmodal System side-panel layout with Component AppBar/Card/ScrollView behavior.',
    usage:
      'Use for backend-neutral side chrome or transient panels, not for generic application sidebars.',
    status: 'accepted',
    accessibility: 'Panel label comes from its title while children retain their own semantics.',
    rtl: 'Panels attach to logical inline edges.',
    touch: 'Scrollable panel content and controls use shared Component runtime behavior.',
    responsive:
      'Width presets clamp to available container space and collapse safely on narrow surfaces.',
    playground: {
      preferredWidth: 'medium',
      fixture: { title: 'System panel', children: 'Panel content' },
    },
  },
  {
    exportName: 'SystemChromeGroup',
    layer: 'system',
    category: 'Chrome',
    order: 40,
    summary:
      'Small labelled grouping helper for System status/actions placed inside bars, docks and panels.',
    usage: 'Use only to group already-built Component controls/status in OXS chrome.',
    status: 'accepted',
    accessibility: 'Creates a named group without replacing child control semantics.',
    rtl: 'Content/trailing slots use logical flow.',
    touch: 'Does not alter child control hit targets.',
    responsive: 'Allows grouped chrome content to wrap within its parent container.',
    playground: {
      preferredWidth: 'wide',
      fixture: { label: 'System chrome group', children: 'Chrome controls' },
    },
  },
  {
    exportName: 'SystemSettingsLayout',
    layer: 'system',
    category: 'Layouts',
    order: 30,
    summary:
      'OXS settings scaffold with adaptive System navigation and scrollable Component-owned content.',
    usage: 'Use for System settings pages; sections and field controls must be public Components.',
    status: 'accepted',
    accessibility:
      'AdaptiveNavigation is labelled and content is exposed as the main settings region.',
    rtl: 'Navigation/content ordering follows logical direction and Component navigation semantics.',
    touch: 'Navigation and form content keep Component touch/focus behavior.',
    responsive: 'Container queries move between split and single-column settings layouts.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        title: 'System settings',
        sections: [{ value: 'display', label: 'Display' }],
        children: 'Settings content',
      },
    },
    examples: [
      { id: 'settings', title: 'Adaptive System settings', component: 'SystemSettingsExample' },
    ],
  },
  {
    exportName: 'SystemNotificationCenter',
    layer: 'system',
    category: 'Layouts',
    order: 30,
    summary:
      'Backend-neutral OXS notification-center presentation over List/ContentState/ScrollView Components.',
    usage:
      'Pass notification view-models from the System owner; delivery, persistence and permission semantics stay outside React.',
    status: 'accepted',
    accessibility:
      'One labelled notification region contains list items with optional activation semantics.',
    rtl: 'Metadata/trailing state use logical list layout.',
    touch: 'Activated items use Component list interaction and touch targets.',
    responsive: 'List and empty states fill available System panel/container space.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        items: [
          {
            id: 'sync',
            title: 'Sync complete',
            body: 'Workspace state is current.',
            metadata: 'now',
            unread: true,
          },
          { id: 'update', title: 'Update ready', body: 'Restart when convenient.' },
        ],
      },
    },
  },
  {
    exportName: 'SystemQuickSettings',
    layer: 'system',
    category: 'Layouts',
    order: 30,
    summary:
      'OXS quick-settings composition for Component toggles, sliders and status groups without backend ownership.',
    usage:
      'Provide System state/actions as Component controls inside sections; hardware/network policy stays native/backend-owned.',
    status: 'accepted',
    accessibility: 'Each Card section labels its contained Component controls.',
    rtl: 'Section grid and controls follow logical Component layout.',
    touch: 'Switch/Slider/Button interactions retain their shared touch and keyboard semantics.',
    responsive: 'Sections collapse from multi-column to single-column by container width.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        sections: [
          {
            id: 'network',
            title: 'Network',
            description: 'Connected',
            content: 'Wi-Fi and connectivity controls',
          },
          {
            id: 'display',
            title: 'Display',
            description: '80%',
            content: 'Brightness and output controls',
          },
        ],
      },
    },
  },
  {
    exportName: 'SystemOsd',
    layer: 'system',
    category: 'Privileged',
    order: 50,
    summary: 'Compact transient System OSD for status/value feedback such as volume or brightness.',
    usage:
      'Render from System state only; hardware mutation and timeout policy stay with the owning runtime.',
    status: 'accepted',
    accessibility: 'StatusIndicator/Progress expose readable status/value semantics.',
    rtl: 'Icon/content flow is logical.',
    touch: 'OSD is informational and does not create hover-only actions.',
    responsive: 'Card clamps to the current output/container and safe region.',
    examples: [
      {
        id: 'transient',
        title: 'Transient and privileged layouts',
        component: 'SystemTransientExample',
      },
    ],
  },
  {
    exportName: 'SystemCommandSurface',
    layer: 'system',
    category: 'Privileged',
    order: 50,
    summary:
      'System command/search dialog composed from Dialog, SearchField, List and ScrollView Components.',
    usage:
      'Pass command view-models and activation callbacks; command discovery/execution authority remains outside the visual surface.',
    status: 'accepted',
    accessibility:
      'Dialog focus lifecycle and labelled command list come from shared overlay/list Components.',
    rtl: 'Search, metadata and command rows use logical Component layout.',
    touch:
      'Commands remain tappable while keyboard search/focus works through Component contracts.',
    responsive: 'Dialog size is bounded and scrolls command results in narrow containers.',
    playground: {
      preferredWidth: 'medium',
      fixture: {
        open: true,
        query: '',
        commands: [
          {
            id: 'settings',
            label: 'Open Settings',
            description: 'System preferences',
            shortcut: 'Ctrl+,',
          },
          {
            id: 'launcher',
            label: 'Open Launcher',
            description: 'Browse applications',
            shortcut: 'Super',
          },
        ],
      },
    },
  },
  {
    exportName: 'SystemLockLayout',
    layer: 'system',
    category: 'Privileged',
    order: 50,
    summary:
      'UI-only lock/auth shell composition with explicit identity, authentication, status and action regions.',
    usage:
      'Authentication backend and secure session authority must be injected; this layout never validates credentials itself.',
    status: 'accepted',
    accessibility:
      'Lock screen landmark contains Component-owned authentication/actions with caller-provided naming.',
    rtl: 'Centered content and logical action layout remain direction-neutral.',
    touch: 'Authentication controls use public Component hit targets and focus semantics.',
    responsive: 'Central auth card clamps and reflows across narrow/wide outputs.',
    playground: {
      preferredWidth: 'medium',
      fixture: { primary: '12:42', authentication: 'Authentication controls' },
    },
  },
  {
    exportName: 'SystemKeyboardHost',
    layer: 'system',
    category: 'Privileged',
    order: 50,
    summary:
      'Privileged OXS touch-keyboard surface with shared Component press semantics and a typed command boundary.',
    usage:
      'Mount only from OXS System composition with compositor-owned surface/session state. Hosts route emitted commands to their native text-input/IME authority.',
    status: 'accepted',
    accessibility:
      'Every key is a native Button with explicit names; modifier state is exposed with aria-pressed and alternate groups are labelled.',
    rtl: 'Persian and other RTL layouts own key-plane direction while the privileged host keeps logical safe-area and block-end geometry.',
    touch:
      'Large Component-owned targets, shared long-press cancellation, alternates and repeat avoid a keyboard-private gesture engine.',
    responsive:
      'Rows flex across narrow/wide containers, preserve minimum touch targets and consume logical safe-area padding.',
    playground: {
      preferredWidth: 'wide',
      fixture: {
        state: {
          surfaceId: 'studio-keyboard',
          sessionId: 'studio-session',
          visible: true,
          language: 'en',
          layout: 'letters',
          contentPurpose: 'text',
          secure: false,
        },
      },
    },
    examples: [
      { id: 'keyboard', title: 'Privileged touch keyboard', component: 'SystemKeyboardExample' },
    ],
  },
] as const);

export function SystemBoundaryExample() {
  return (
    <SystemScaffold
      className="ui-doc-system-scaffold"
      workspace={<SystemWorkspace title="OXS preview" status="Studio" />}
      chrome={
        <SystemSurface kind="chrome" edge="block-start" label="System chrome preview">
          <Card
            padding="sm"
            title="Component-owned chrome"
            description="System placement; Component visuals."
          />
        </SystemSurface>
      }
      privileged={
        <SystemSurface kind="privileged" edge="block-end" label="Privileged host preview">
          <Card
            padding="sm"
            title="Privileged host slot"
            description="UIR14 proves only the structural host; privileged behavior belongs to UIR15."
          />
        </SystemSurface>
      }
    />
  );
}

export function SystemKeyboardExample() {
  const [state, setState] = useState<SystemKeyboardSurfaceState>({
    surfaceId: 'studio-system-keyboard',
    sessionId: 'studio-text-session',
    visible: true,
    language: 'en',
    layout: 'letters',
    contentPurpose: 'text',
    secure: false,
  });
  const [lastCommand, setLastCommand] = useState<SystemKeyboardCommand | null>(null);
  const onCommand = (command: SystemKeyboardCommand) => {
    setLastCommand(command);
    if (command.type === 'request-language')
      setState((current) => ({ ...current, language: command.language, layout: 'letters' }));
    if (command.type === 'request-layout')
      setState((current) => ({ ...current, layout: command.layout }));
  };
  return (
    <div className="ui-doc-system-keyboard-example">
      <div className="ui-doc-system-keyboard-example__controls">
        <Select
          label="Content purpose"
          value={state.contentPurpose}
          options={['text', 'password', 'numeric', 'email', 'url', 'search'].map((value) => ({
            value,
            label: value,
          }))}
          onValueChange={(value) =>
            setState((current) => ({
              ...current,
              contentPurpose: value as SystemKeyboardSurfaceState['contentPurpose'],
              layout: value === 'numeric' ? 'numeric' : 'letters',
              secure: value === 'password',
            }))
          }
        />
        <Select
          label="Language"
          value={state.language}
          options={[
            { value: 'en', label: 'English' },
            { value: 'fa', label: 'فارسی' },
          ]}
          onValueChange={(value) =>
            setState((current) => ({
              ...current,
              language: value as SystemKeyboardSurfaceState['language'],
              layout: 'letters',
            }))
          }
        />
        <Switch
          label="Secure session"
          checked={state.secure}
          onCheckedChange={(secure) => setState((current) => ({ ...current, secure }))}
        />
      </div>
      <div className="ui-doc-system-keyboard-example__stage">
        <SystemKeyboardHost state={state} onCommand={onCommand} />
      </div>
      <StatusIndicator
        label={lastCommand ? `Last command: ${lastCommand.type}` : 'Ready for input'}
        tone={lastCommand ? 'success' : 'neutral'}
      />
    </div>
  );
}

export function SystemApplicationBrowserExample() {
  const [query, setQuery] = useState('');
  const [requestedApplicationId, setRequestedApplicationId] = useState('none');
  const apps = useMemo(
    () =>
      [
        {
          id: 'browser',
          name: 'Browser',
          icon: 'browser' as const,
          keywords: ['web'],
          description: 'Web application',
        },
        {
          id: 'files',
          name: 'Files',
          icon: 'files' as const,
          keywords: ['folders'],
          description: 'Local files',
        },
      ].filter((app) =>
        `${app.name} ${app.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div data-uir14-application-browser-example>
      <SystemApplicationBrowser
        title="Applications"
        subtitle="Caller-owned view models and activation"
        query={query}
        apps={apps}
        onQueryChange={setQuery}
        onActivate={setRequestedApplicationId}
      />
      <StatusIndicator
        label={`Requested application id: ${requestedApplicationId}`}
        tone={requestedApplicationId === 'none' ? 'neutral' : 'success'}
      />
    </div>
  );
}

export function SystemLauncherExample() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const apps = useMemo(
    () =>
      [
        { id: 'browser', name: 'Browser', icon: 'browser' as const, keywords: ['web'] },
        { id: 'files', name: 'Files', icon: 'files' as const, keywords: ['folders'] },
      ].filter((app) =>
        `${app.name} ${app.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <div>
      <Button size="sm" onClick={() => setOpen(true)}>
        Open System Launcher
      </Button>
      <SystemLauncher
        open={open}
        query={query}
        apps={apps}
        onQueryChange={setQuery}
        onLaunch={() => false}
        onClose={() => setOpen(false)}
      />
      <StatusIndicator label="System composition uses Components only" tone="success" />
    </div>
  );
}

export function SystemLayoutLibraryExample() {
  return (
    <div className="ui-doc-system-layout-preview" data-uir14-layout-library>
      <DesktopShellLayout
        workspace={
          <SystemWorkspace title="OXS" status="Layout preview">
            <Card
              className="ui-doc-system-layout-preview__scene"
              title="Native scene slot"
              description="Window/compositor authority remains outside React."
            />
          </SystemWorkspace>
        }
        topBar={
          <SystemBar
            label="Top system bar"
            leading={
              <SystemChromeGroup label="Connectivity" trailing={<Badge>2</Badge>}>
                <StatusIndicator label="Online" tone="success" />
              </SystemChromeGroup>
            }
            trailing={<Badge>12:42</Badge>}
          />
        }
        dockEdge="inline-start"
        dock={
          <SystemDock edge="inline-start">
            <Button size="sm">Apps</Button>
            <Button size="sm">Files</Button>
          </SystemDock>
        }
        panelEdge="inline-end"
        panel={
          <SystemPanel title="System panel" width="sm" edge="inline-end">
            <StatusIndicator label="All services ready" tone="success" />
          </SystemPanel>
        }
      />
    </div>
  );
}

export function SystemSettingsExample() {
  const [section, setSection] = useState('display');
  return (
    <div className="ui-doc-system-settings-preview">
      <SystemSettingsLayout
        title="System settings"
        sections={[
          { value: 'display', label: 'Display' },
          { value: 'input', label: 'Input' },
          { value: 'privacy', label: 'Privacy' },
        ]}
        value={section}
        onValueChange={setSection}
      >
        <Card title="Adaptive content" description={`Current section: ${section}`}>
          <Switch label="Example setting" defaultChecked />
        </Card>
      </SystemSettingsLayout>
    </div>
  );
}

export function SystemTransientExample() {
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const commands = [
    { id: 'settings', label: 'Open settings', shortcut: 'Ctrl+,' },
    { id: 'lock', label: 'Lock session', shortcut: 'Super+L' },
  ].filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="ui-doc-system-transient-preview">
      <SystemOsd label="Volume" value={64} tone="accent" />
      <Button onClick={() => setCommandsOpen(true)}>Open commands</Button>
      <SystemQuickSettings
        sections={[
          { id: 'wireless', title: 'Wireless', content: <Switch label="Wi-Fi" defaultChecked /> },
          { id: 'audio', title: 'Audio', content: <Slider label="Volume" defaultValue={64} /> },
        ]}
      />
      <SystemLockLayout
        primary="12:42"
        secondary="Tuesday"
        authentication={<Button variant="primary">Unlock</Button>}
      />
      <SystemCommandSurface
        open={commandsOpen}
        query={query}
        commands={commands}
        onQueryChange={setQuery}
        onActivate={() => setCommandsOpen(false)}
        onOpenChange={setCommandsOpen}
      />
    </div>
  );
}
