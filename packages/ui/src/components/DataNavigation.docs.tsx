import {
  ActionGroup,
  AdaptiveNavigation,
  AppBar,
  Badge,
  Button,
  EmptyState,
  Icon,
  List,
  ListItem,
  ListSection,
  ListSeparator,
  Progress,
  Row,
  Skeleton,
  Spinner,
  Stack,
  StatusIndicator,
  TabPanel,
  Tabs,
  Text,
  Toolbar,
  tabRelationshipIds,
} from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'ListItem',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary:
      'Generic static or actionable data row with leading, copy, metadata and trailing regions.',
    usage:
      'Use for settings, results, choices and data rows; product data ownership stays outside the component.',
    status: 'accepted',
    accessibility:
      'Native li rows preserve list semantics; actionable rows use one sibling primary button so trailing controls can never nest inside it.',
    rtl: 'Leading/trailing and metadata placement follow logical inline order.',
    touch: 'Action rows keep the platform minimum touch target.',
    responsive: 'Copy truncates safely while metadata/trailing regions remain bounded.',
    examples: [
      {
        id: 'collection-contract',
        title: 'Semantic list collection',
        component: 'DataListContractExample',
      },
    ],
  },
  {
    exportName: 'List',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary: 'Generic semantic list collection with optional separators.',
    usage: 'Own collection structure, not application data fetching or virtualization.',
    status: 'accepted',
    accessibility:
      'Uses native ul/li collection semantics and explicit loading/empty/error replacement-state announcements.',
    rtl: 'Collection flow inherits logical direction.',
    touch: 'Interactive children own their target policy.',
    responsive: 'Fills available inline size without viewport assumptions.',
    examples: [
      {
        id: 'collection-contract',
        title: 'Semantic list collection',
        component: 'DataListContractExample',
      },
    ],
  },
  {
    exportName: 'ListSection',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary: 'Labeled collection section with description and trailing utility region.',
    usage: 'Group related list content without embedding product-specific section models.',
    status: 'accepted',
    accessibility: 'Uses a native section plus semantic Heading and description relationships.',
    rtl: 'Header copy and trailing utility use logical order.',
    touch: 'No private interaction ownership.',
    responsive: 'Header regions wrap inside narrow containers.',
    examples: [
      {
        id: 'collection-contract',
        title: 'Semantic list collection',
        component: 'DataListContractExample',
      },
    ],
  },
  {
    exportName: 'ListSeparator',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary: 'List-aware separator with full or content inset.',
    usage: 'Use inside list collections when visual grouping needs an explicit divider.',
    status: 'accepted',
    accessibility:
      'Renders a presentation-only list row containing the decorative Divider so listitem counts remain accurate.',
    rtl: 'Content inset is logical, not left/right specific.',
    touch: 'Non-interactive.',
    responsive: 'Tracks collection width.',
    examples: [
      {
        id: 'collection-contract',
        title: 'Semantic list collection',
        component: 'DataListContractExample',
      },
    ],
  },
  {
    exportName: 'Tabs',
    layer: 'components',
    category: 'Navigation',
    order: 40,
    summary:
      'Roving-focus tab list with controlled/uncontrolled selection and automatic or manual activation.',
    usage:
      'Use to switch peer views inside one context; application-wide navigation belongs to AdaptiveNavigation.',
    status: 'accepted',
    accessibility:
      'Uses tablist/tab semantics with invalid-selection recovery, explicit orientation, selected state and one roving focus target.',
    rtl: 'Horizontal arrow traversal follows logical direction.',
    touch: 'Each tab retains the shared Button target policy.',
    responsive:
      'The tab strip can scroll/clip within constrained containers without device detection.',
    playground: {
      preferredWidth: 'medium',
      controls: ['activationMode', 'size'],
      options: {
        activationMode: ['automatic', 'manual'],
        size: ['sm', 'md', 'lg'],
      },
      fixture: {
        label: 'Workbench sections',
        items: [
          { value: 'overview', label: 'Overview' },
          { value: 'api', label: 'API' },
          { value: 'examples', label: 'Examples' },
        ],
        defaultValue: 'overview',
      },
    },
    examples: [
      { id: 'tabs-contract', title: 'Manual/automatic tabs', component: 'TabsContractExample' },
    ],
  },
  {
    exportName: 'TabPanel',
    layer: 'components',
    category: 'Navigation',
    order: 40,
    summary: 'Companion panel for Tabs with explicit selected-value and labelled-by relationships.',
    usage:
      'Pair with tabRelationshipIds so the tab and panel IDs stay deterministic without hand-built strings.',
    status: 'accepted',
    accessibility:
      'Uses tabpanel semantics with deterministic idBase-derived relationships or caller-supplied ids, plus optional mounted hidden content.',
    rtl: 'Content direction inherits from the surrounding UiRoot.',
    touch: 'Non-interactive container; descendants own interaction.',
    responsive: 'Fills available container space without viewport assumptions.',
    examples: [
      { id: 'tabs-contract', title: 'Manual/automatic tabs', component: 'TabsContractExample' },
    ],
  },
  {
    exportName: 'AdaptiveNavigation',
    layer: 'components',
    category: 'Navigation',
    order: 40,
    summary:
      'Generic container-driven navigation that can render bar, rail, drawer or adaptive auto layouts.',
    usage:
      'Use for application-level destinations; keep OXS launcher/workspace semantics in System UI.',
    status: 'accepted',
    accessibility:
      'Uses a nav landmark and aria-current; href destinations preserve native anchor semantics while action destinations remain native buttons.',
    rtl: 'Ordering and icon/copy placement inherit logical direction.',
    touch: 'Destination controls use Button interaction ownership.',
    responsive: 'Auto mode changes bar → rail → drawer from container width, not device identity.',
    playground: {
      preferredWidth: 'wide',
      controls: ['mode'],
      options: { mode: ['auto', 'bar', 'rail', 'drawer'] },
      fixture: {
        label: 'Workspace navigation',
        items: [
          { value: 'home', label: 'Home' },
          { value: 'apps', label: 'Applications' },
          { value: 'settings', label: 'Settings' },
        ],
        defaultValue: 'home',
      },
    },
    examples: [
      {
        id: 'navigation-contract',
        title: 'Native link + action destinations',
        component: 'AdaptiveNavigationContractExample',
      },
    ],
  },
  {
    exportName: 'ActionGroup',
    layer: 'components',
    category: 'Actions',
    order: 12,
    summary:
      'Named semantic action cluster that preserves every child action and never invents responsive hiding.',
    usage:
      'Group related commands inside or outside a Toolbar; overflow/collapse policy belongs to the containing Toolbar/caller, not the group.',
    status: 'accepted',
    accessibility:
      'Exposes a named group while preserving each child control semantics and tab behavior.',
    rtl: 'Action order follows logical DOM order and surrounding direction.',
    touch: 'Child actions retain their own minimum target policy.',
    responsive: 'Wraps or stacks by explicit orientation but never silently removes commands.',
    examples: [
      { id: 'contract', title: 'Named action group', component: 'ActionGroupContractExample' },
    ],
  },
  {
    exportName: 'Toolbar',
    layer: 'components',
    category: 'Actions',
    order: 13,
    summary:
      'Named command toolbar with one roving tab stop, logical arrow/Home/End navigation and a caller-owned pinned overflow slot.',
    usage:
      'Use for related commands. Toolbar owns roving focus and reachability; callers own which equivalent commands appear in overflow.',
    status: 'accepted',
    accessibility:
      'Uses toolbar/orientation semantics with exactly one roving tab stop across enabled command controls.',
    rtl: 'Horizontal ArrowLeft/ArrowRight traversal follows resolved logical direction; vertical toolbars use ArrowUp/ArrowDown.',
    touch: 'Never shrinks child Button/IconButton targets and keeps overflow reachable.',
    responsive:
      'Primary content may scroll while an explicit overflow action stays pinned; Toolbar never silently moves or hides commands.',
    examples: [
      { id: 'contract', title: 'Roving command toolbar', component: 'ToolbarContractExample' },
    ],
  },
  {
    exportName: 'AppBar',
    layer: 'components',
    category: 'Navigation',
    order: 40,
    summary: 'Generic title/subtitle/leading/actions header composition.',
    usage: 'Use in developer application layouts; OXS system bars are composed later in System UI.',
    status: 'candidate',
    accessibility: 'Associates the header with its title and preserves child control semantics.',
    rtl: 'Leading/title/actions use logical regions.',
    touch: 'Interactive children preserve shared target policy.',
    responsive: 'Actions remain bounded while copy can truncate/wrap.',
  },
  {
    exportName: 'Badge',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Compact semantic-tone label/count indicator.',
    usage:
      'Use for short metadata and counts; use StatusIndicator for state with meaning beyond a label.',
    status: 'accepted',
    accessibility:
      'Plain text remains readable by assistive technology unless the caller explicitly hides it.',
    rtl: 'Inline content follows surrounding bidi flow.',
    touch: 'Non-interactive.',
    responsive: 'Intrinsic and lightweight.',
    examples: [{ id: 'overview', title: 'Feedback states', component: 'FeedbackExample' }],
  },
  {
    exportName: 'StatusIndicator',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Tone-aware status dot with visible or visually-hidden label.',
    usage: 'Use for presence/health/state summaries that need an accessible status name.',
    status: 'accepted',
    accessibility:
      'Static status is ordinary labelled content by default; set announce when a state transition genuinely needs a polite live-region announcement.',
    rtl: 'Dot and label use logical inline order.',
    touch: 'Non-interactive.',
    responsive: 'Intrinsic and wrap-safe.',

    examples: [
      { id: 'feedback-contract', title: 'Feedback semantics', component: 'FeedbackExample' },
    ],
  },
  {
    exportName: 'Progress',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary:
      'Determinate or indeterminate native progress contract with optional visible percentage.',
    usage: 'Use for bounded work progress; omit value for indeterminate work.',
    status: 'accepted',
    accessibility: 'Built on native progress semantics with an accessible label.',
    rtl: 'Label/value header follows logical order.',
    touch: 'Non-interactive.',
    responsive: 'Track fills available inline size.',

    examples: [
      { id: 'feedback-contract', title: 'Feedback semantics', component: 'FeedbackExample' },
    ],
  },
  {
    exportName: 'Spinner',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary:
      'OntologyX O+X indeterminate activity mark with inline through hero-scale presentation and reduced-motion settlement.',
    usage:
      'Use sm/md/lg for local transient activity and hero for first-entry or boot loading; the shared OX mark is also used by loading controls so product surfaces do not invent parallel spinners.',
    status: 'accepted',
    accessibility:
      'Decorative/static activity is hidden from the accessibility tree by default; set announce to expose a polite loading status when the owning region needs it.',
    rtl: 'Direction-neutral.',
    touch: 'Non-interactive.',
    responsive:
      'Intrinsic; hero keeps the same brand geometry with a stronger display-scale stroke treatment.',
    playground: {
      preferredWidth: 'wide',
      controls: ['size', 'renderer', 'announce'],
      options: { size: ['sm', 'md', 'lg', 'hero'], renderer: ['svg', 'canvas'] },
      fixture: { size: 'hero', renderer: 'svg', label: 'Starting OntologyX' },
    },
    examples: [
      { id: 'ox-loading', title: 'OX boot loading choreography', component: 'SpinnerExample' },
    ],
  },
  {
    exportName: 'Skeleton',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Decorative lightweight placeholder for text, rectangle and avatar-like shapes.',
    usage:
      'Use to preserve layout while nearby content is loading; announce loading state on the owning region instead.',
    status: 'accepted',
    accessibility: 'Hidden from the accessibility tree so it does not become fake content.',
    rtl: 'Direction-neutral geometry.',
    touch: 'Non-interactive.',
    responsive: 'Width presets remain container-relative.',

    examples: [
      { id: 'feedback-contract', title: 'Feedback semantics', component: 'FeedbackExample' },
    ],
  },
  {
    exportName: 'EmptyState',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Generic empty-content composition with optional icon, description and action.',
    usage:
      'Use for empty collections/results without embedding product-specific copy or recovery logic.',
    status: 'accepted',
    accessibility: 'Keeps semantic text/action ownership with caller-provided content.',
    rtl: 'Centered composition is bidi-safe.',
    touch: 'Optional action consumes the normal component target contract.',
    responsive: 'Constrained readable copy adapts to narrow containers.',

    examples: [
      { id: 'feedback-contract', title: 'Feedback semantics', component: 'FeedbackExample' },
    ],
  },
] as const);

export function DataListContractExample() {
  const [selected, setSelected] = useState('files');
  const [state, setState] = useState<'ready' | 'loading' | 'empty' | 'error'>('ready');
  return (
    <Stack gap="md">
      <Row gap="sm" className="ui-doc-example-wrap">
        {(['ready', 'loading', 'empty', 'error'] as const).map((next) => (
          <Button
            key={next}
            size="sm"
            variant={state === next ? 'primary' : 'quiet'}
            onClick={() => setState(next)}
          >
            {next}
          </Button>
        ))}
      </Row>
      <ListSection
        title="Recent locations"
        description="Native list semantics with sibling trailing actions."
      >
        <List
          label="Recent locations"
          divided
          state={state}
          stateLabel={
            state === 'loading'
              ? 'Loading locations'
              : state === 'empty'
                ? 'No locations'
                : state === 'error'
                  ? 'Locations unavailable'
                  : undefined
          }
          stateContent={
            state === 'loading'
              ? 'Loading…'
              : state === 'empty'
                ? 'Nothing here yet.'
                : state === 'error'
                  ? 'Could not load locations.'
                  : undefined
          }
        >
          <ListItem
            primary="Desktop"
            secondary="12 items"
            leading={<Icon name="apps" />}
            metadata="Now"
          />
          <ListSeparator />
          <ListItem
            primary="Files"
            secondary="Local documents"
            selected={selected === 'files'}
            selectionSemantics="current"
            onActivate={() => setSelected('files')}
            trailing={
              <Button size="sm" aria-label="More file actions">
                More
              </Button>
            }
          />
          <ListItem
            primary="Archive"
            secondary="Read only"
            disabled
            onActivate={() => setSelected('archive')}
          />
        </List>
      </ListSection>
    </Stack>
  );
}

export function DataListExample() {
  return <DataListContractExample />;
}

export function TabsContractExample() {
  const [automatic, setAutomatic] = useState('overview');
  const [manual, setManual] = useState('overview');
  return (
    <Stack gap="md">
      <Tabs
        idBase="automatic-tabs"
        label="Automatic sections"
        value={automatic}
        onValueChange={setAutomatic}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'activity', label: 'Activity' },
        ]}
      />
      <TabPanel idBase="automatic-tabs" value="overview" activeValue={automatic}>
        Overview content
      </TabPanel>
      <TabPanel idBase="automatic-tabs" value="activity" activeValue={automatic}>
        Activity content
      </TabPanel>
      <Tabs
        idBase="manual-tabs"
        label="Manual sections"
        activationMode="manual"
        value={manual}
        onValueChange={setManual}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'activity', label: 'Activity' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ]}
      />
      <TabPanel idBase="manual-tabs" value="overview" activeValue={manual}>
        Manual overview
      </TabPanel>
      <TabPanel idBase="manual-tabs" value="activity" activeValue={manual}>
        Manual activity
      </TabPanel>
    </Stack>
  );
}

export function AdaptiveNavigationContractExample() {
  const [destination, setDestination] = useState('home');
  return (
    <AdaptiveNavigation
      label="Workspace destinations"
      value={destination}
      onValueChange={setDestination}
      items={[
        { value: 'home', label: 'Home', icon: <Icon name="apps" />, href: '#home' },
        { value: 'search', label: 'Search', icon: <Icon name="search" />, href: '#search' },
        {
          value: 'settings',
          label: 'Settings',
          icon: <Icon name="settings" />,
          onActivate: () => undefined,
        },
      ]}
    />
  );
}

export function NavigationExample() {
  const [tab, setTab] = useState('overview');
  const [destination, setDestination] = useState('home');
  const items = [
    { value: 'home', label: 'Home', icon: <Icon name="apps" /> },
    {
      value: 'search',
      label: 'Search',
      icon: <Icon name="search" />,
      badge: <Badge size="sm">3</Badge>,
    },
    { value: 'settings', label: 'Settings', icon: <Icon name="settings" /> },
  ];
  return (
    <div className="ui-doc-data-nav-example">
      <Tabs
        label="Preview sections"
        value={tab}
        onValueChange={setTab}
        items={[
          {
            value: 'overview',
            label: 'Overview',
            id: tabRelationshipIds('preview', 'overview').tabId,
            panelId: tabRelationshipIds('preview', 'overview').panelId,
          },
          {
            value: 'activity',
            label: 'Activity',
            id: tabRelationshipIds('preview', 'activity').tabId,
            panelId: tabRelationshipIds('preview', 'activity').panelId,
          },
        ]}
      />
      <TabPanel
        id={tabRelationshipIds('preview', tab).panelId}
        value={tab}
        activeValue={tab}
        labelledBy={tabRelationshipIds('preview', tab).tabId}
      >
        {tab === 'overview' ? 'Overview content' : 'Activity content'}
      </TabPanel>
      <AdaptiveNavigation
        label="Example navigation"
        items={items}
        value={destination}
        onValueChange={setDestination}
      />
      <AppBar
        title="Workspace"
        subtitle="Generic application header"
        actions={
          <Toolbar label="Workspace actions">
            <ActionGroup label="Primary actions">
              <Button size="sm">New</Button>
            </ActionGroup>
          </Toolbar>
        }
      />
    </div>
  );
}

export function ActionGroupContractExample() {
  return (
    <ActionGroup label="Document actions">
      <Button size="sm" variant="primary">
        Save
      </Button>
      <Button size="sm" variant="secondary">
        Duplicate
      </Button>
      <Button size="sm" intent="destructive" variant="quiet">
        Delete
      </Button>
    </ActionGroup>
  );
}

export function ToolbarContractExample() {
  return (
    <Toolbar
      label="Editor commands"
      overflow={
        <Button size="sm" aria-label="More commands">
          More
        </Button>
      }
    >
      <ActionGroup label="Editing">
        <Button size="sm">Undo</Button>
        <Button size="sm">Redo</Button>
        <Button size="sm" disabled>
          Cut
        </Button>
      </ActionGroup>
      <ActionGroup label="Document">
        <Button size="sm" variant="primary">
          Save
        </Button>
      </ActionGroup>
    </Toolbar>
  );
}

export function FeedbackExample() {
  return (
    <div className="ui-doc-feedback-example">
      <Badge tone="accent">12</Badge>
      <StatusIndicator tone="success" label="Connected" />
      <Progress label="Sync" value={64} showValue />
      <Spinner label="Refreshing" />
      <Skeleton width="medium" />
      <EmptyState
        title="Nothing here yet"
        description="Create an item when you are ready."
        action={<Button size="sm">Create</Button>}
      />
    </div>
  );
}

export function SpinnerExample() {
  const [renderer, setRenderer] = useState<'svg' | 'canvas'>('svg');
  return (
    <div className="ui-doc-spinner-boot" data-oxs-spinner-example="heartbeat">
      <Stack gap="lg" className="ui-doc-spinner-boot__content">
        <Stack gap="2xs" className="ui-doc-spinner-boot__copy">
          <Text variant="body-strong">First-entry loading</Text>
          <Text tone="tertiary">
            One OX choreography, two render backends. Canvas lazy-loads only when selected.
          </Text>
        </Stack>
        <Row gap="sm" justify="center" className="ui-doc-spinner-boot__renderer">
          <Button
            size="sm"
            variant={renderer === 'svg' ? 'primary' : 'quiet'}
            onClick={() => setRenderer('svg')}
          >
            SVG
          </Button>
          <Button
            size="sm"
            variant={renderer === 'canvas' ? 'primary' : 'quiet'}
            onClick={() => setRenderer('canvas')}
          >
            Canvas
          </Button>
        </Row>
        <Spinner
          data-oxs-spinner-purpose="boot"
          label="Starting OntologyX"
          announce
          renderer={renderer}
          size="hero"
        />
      </Stack>
    </div>
  );
}
