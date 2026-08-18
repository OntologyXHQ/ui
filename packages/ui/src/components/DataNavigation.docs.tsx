import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { Icon } from '../primitives';
import { Button } from './Button';
import { Badge, EmptyState, Progress, Skeleton, Spinner, StatusIndicator } from './Feedback';
import { List, ListItem, ListSection } from './DataList';
import { ActionGroup, AdaptiveNavigation, AppBar, tabRelationshipIds, TabPanel, Tabs, Toolbar } from './Navigation';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'ListItem', layer: 'components', category: 'Data & collection', order: 50,
    summary: 'Generic static or actionable data row with leading, copy, metadata and trailing regions.',
    usage: 'Use for settings, results, choices and data rows; product data ownership stays outside the component.',
    status: 'stable', accessibility: 'Static rows preserve list semantics; actionable rows use a native button with optional current-state exposure.',
    rtl: 'Leading/trailing and metadata placement follow logical inline order.', touch: 'Action rows keep the platform minimum touch target.', responsive: 'Copy truncates safely while metadata/trailing regions remain bounded.',
    examples: [{ id: 'overview', title: 'List rows', component: 'DataListExample' }],
  },
  {
    exportName: 'List', layer: 'components', category: 'Data & collection', order: 50,
    summary: 'Generic semantic list collection with optional separators.', usage: 'Own collection structure, not application data fetching or virtualization.',
    status: 'stable', accessibility: 'Exposes list/listitem semantics through ListItem children.', rtl: 'Collection flow inherits logical direction.', touch: 'Interactive children own their target policy.', responsive: 'Fills available inline size without viewport assumptions.',
  },
  {
    exportName: 'ListSection', layer: 'components', category: 'Data & collection', order: 50,
    summary: 'Labeled collection section with description and trailing utility region.', usage: 'Group related list content without embedding product-specific section models.',
    status: 'stable', accessibility: 'Section heading is programmatically associated with its content.', rtl: 'Header copy and trailing utility use logical order.', touch: 'No private interaction ownership.', responsive: 'Header regions wrap inside narrow containers.',
  },
  {
    exportName: 'ListSeparator', layer: 'components', category: 'Data & collection', order: 50,
    summary: 'List-aware separator with full or content inset.', usage: 'Use inside list collections when visual grouping needs an explicit divider.',
    status: 'stable', accessibility: 'Uses the semantic Divider primitive.', rtl: 'Content inset is logical, not left/right specific.', touch: 'Non-interactive.', responsive: 'Tracks collection width.',
  },
  {
    exportName: 'Tabs', layer: 'components', category: 'Navigation', order: 40,
    summary: 'Roving-focus tab list with controlled/uncontrolled selection and automatic or manual activation.', usage: 'Use to switch peer views inside one context; application-wide navigation belongs to AdaptiveNavigation.',
    status: 'stable', accessibility: 'Uses tablist/tab semantics with selected state and roving keyboard focus.', rtl: 'Horizontal arrow traversal follows logical direction.', touch: 'Each tab retains the shared Button target policy.', responsive: 'The tab strip can scroll/clip within constrained containers without device detection.',
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
    examples: [{ id: 'overview', title: 'Tabs + navigation', component: 'NavigationExample' }],
  },
  {
    exportName: 'TabPanel', layer: 'components', category: 'Navigation', order: 40,
    summary: 'Companion panel for Tabs with explicit selected-value and labelled-by relationships.',
    usage: 'Pair with tabRelationshipIds so the tab and panel IDs stay deterministic without hand-built strings.',
    status: 'stable', accessibility: 'Uses tabpanel semantics, aria-labelledby and hidden state while preserving optional mounted content.', rtl: 'Content direction inherits from the surrounding UiRoot.', touch: 'Non-interactive container; descendants own interaction.', responsive: 'Fills available container space without viewport assumptions.',
  },
  {
    exportName: 'AdaptiveNavigation', layer: 'components', category: 'Navigation', order: 40,
    summary: 'Generic container-driven navigation that can render bar, rail, drawer or adaptive auto layouts.', usage: 'Use for application-level destinations; keep OXS launcher/workspace semantics in System UI.',
    status: 'stable', accessibility: 'Uses nav landmarks and aria-current for the active destination.', rtl: 'Ordering and icon/copy placement inherit logical direction.', touch: 'Destination controls use Button interaction ownership.', responsive: 'Auto mode changes bar → rail → drawer from container width, not device identity.',
    playground: {
      preferredWidth: 'wide', controls: ['mode'], options: { mode: ['auto', 'bar', 'rail', 'drawer'] },
      fixture: { label: 'Workspace navigation', items: [{ value: 'home', label: 'Home' }, { value: 'apps', label: 'Applications' }, { value: 'settings', label: 'Settings' }], defaultValue: 'home' },
    },
  },
  {
    exportName: 'ActionGroup', layer: 'components', category: 'Navigation', order: 40,
    summary: 'Labeled action cluster with optional compact-collapse intent for toolbars.', usage: 'Group related actions; pair compact-collapsible groups with an equivalent overflow action.',
    status: 'stable', accessibility: 'Exposes a named group without changing child button semantics.', rtl: 'Action order follows logical direction.', touch: 'Child actions own target policy.', responsive: 'Compact groups can collapse in constrained toolbar containers.',
  },
  {
    exportName: 'Toolbar', layer: 'components', category: 'Navigation', order: 40,
    summary: 'Keyboard-roving toolbar with an explicit overflow slot.', usage: 'Use for related action sets; menu behavior for the overflow action comes from the overlay component layer.',
    status: 'stable', accessibility: 'Uses toolbar semantics and shared roving keyboard focus.', rtl: 'Horizontal keyboard traversal resolves logical direction.', touch: 'Does not shrink child action targets.', responsive: 'Content can scroll/collapse while overflow stays reachable.',
  },
  {
    exportName: 'AppBar', layer: 'components', category: 'Navigation', order: 40,
    summary: 'Generic title/subtitle/leading/actions header composition.', usage: 'Use in developer application layouts; OXS system bars are composed later in System UI.',
    status: 'stable', accessibility: 'Associates the header with its title and preserves child control semantics.', rtl: 'Leading/title/actions use logical regions.', touch: 'Interactive children preserve shared target policy.', responsive: 'Actions remain bounded while copy can truncate/wrap.',
  },
  {
    exportName: 'Badge', layer: 'components', category: 'Feedback', order: 60,
    summary: 'Compact semantic-tone label/count indicator.', usage: 'Use for short metadata and counts; use StatusIndicator for state with meaning beyond a label.',
    status: 'stable', accessibility: 'Plain text remains readable by assistive technology unless the caller explicitly hides it.', rtl: 'Inline content follows surrounding bidi flow.', touch: 'Non-interactive.', responsive: 'Intrinsic and lightweight.',
    examples: [{ id: 'overview', title: 'Feedback states', component: 'FeedbackExample' }],
  },
  {
    exportName: 'StatusIndicator', layer: 'components', category: 'Feedback', order: 60,
    summary: 'Tone-aware status dot with visible or visually-hidden label.', usage: 'Use for presence/health/state summaries that need an accessible status name.',
    status: 'stable', accessibility: 'Static status is ordinary labelled content by default; set announce when a state transition genuinely needs a polite live-region announcement.', rtl: 'Dot and label use logical inline order.', touch: 'Non-interactive.', responsive: 'Intrinsic and wrap-safe.',
  },
  {
    exportName: 'Progress', layer: 'components', category: 'Feedback', order: 60,
    summary: 'Determinate or indeterminate native progress contract with optional visible percentage.', usage: 'Use for bounded work progress; omit value for indeterminate work.',
    status: 'stable', accessibility: 'Built on native progress semantics with an accessible label.', rtl: 'Label/value header follows logical order.', touch: 'Non-interactive.', responsive: 'Track fills available inline size.',
  },
  {
    exportName: 'Spinner', layer: 'components', category: 'Feedback', order: 60,
    summary: 'Small reduced-motion-aware indeterminate activity indicator.', usage: 'Use for local transient activity where a full Progress track would be excessive.',
    status: 'stable', accessibility: 'Decorative/static activity is hidden from the accessibility tree by default; set announce to expose a polite loading status when the owning region needs it.', rtl: 'Direction-neutral.', touch: 'Non-interactive.', responsive: 'Intrinsic.',
  },
  {
    exportName: 'Skeleton', layer: 'components', category: 'Feedback', order: 60,
    summary: 'Decorative lightweight placeholder for text, rectangle and avatar-like shapes.', usage: 'Use to preserve layout while nearby content is loading; announce loading state on the owning region instead.',
    status: 'stable', accessibility: 'Hidden from the accessibility tree so it does not become fake content.', rtl: 'Direction-neutral geometry.', touch: 'Non-interactive.', responsive: 'Width presets remain container-relative.',
  },
  {
    exportName: 'EmptyState', layer: 'components', category: 'Feedback', order: 60,
    summary: 'Generic empty-content composition with optional icon, description and action.', usage: 'Use for empty collections/results without embedding product-specific copy or recovery logic.',
    status: 'stable', accessibility: 'Keeps semantic text/action ownership with caller-provided content.', rtl: 'Centered composition is bidi-safe.', touch: 'Optional action consumes the normal component target contract.', responsive: 'Constrained readable copy adapts to narrow containers.',
  },
] as const);

export function DataListExample() {
  const [selected, setSelected] = useState('files');
  return (
    <List label="Recent locations" divided>
      <ListItem primary="Desktop" secondary="12 items" leading={<Icon name="apps" />} metadata="Now" />
      <ListItem primary="Files" secondary="Local documents" selected={selected === 'files'} onActivate={() => setSelected('files')} trailing={<Badge tone="accent">8</Badge>} />
      <ListItem primary="Archive" secondary="Read only" disabled onActivate={() => setSelected('archive')} />
    </List>
  );
}

export function NavigationExample() {
  const [tab, setTab] = useState('overview');
  const [destination, setDestination] = useState('home');
  const items = [
    { value: 'home', label: 'Home', icon: <Icon name="apps" /> },
    { value: 'search', label: 'Search', icon: <Icon name="search" />, badge: <Badge size="sm">3</Badge> },
    { value: 'settings', label: 'Settings', icon: <Icon name="settings" /> },
  ];
  return (
    <div className="ui-doc-data-nav-example">
      <Tabs
        label="Preview sections"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'overview', label: 'Overview', id: tabRelationshipIds('preview', 'overview').tabId, panelId: tabRelationshipIds('preview', 'overview').panelId },
          { value: 'activity', label: 'Activity', id: tabRelationshipIds('preview', 'activity').tabId, panelId: tabRelationshipIds('preview', 'activity').panelId },
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
      <AdaptiveNavigation label="Example navigation" items={items} value={destination} onValueChange={setDestination} />
      <AppBar title="Workspace" subtitle="Generic application header" actions={<Toolbar label="Workspace actions"><ActionGroup label="Primary actions"><Button size="sm">New</Button></ActionGroup></Toolbar>} />
    </div>
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
      <EmptyState title="Nothing here yet" description="Create an item when you are ready." action={<Button size="sm">Create</Button>} />
    </div>
  );
}
