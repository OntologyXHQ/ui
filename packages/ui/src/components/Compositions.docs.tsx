import {
  Accordion,
  ApplicationItem,
  Badge,
  Button,
  Card,
  ContentState,
  Disclosure,
  Icon,
  PageScaffold,
  ScrollView,
  Tile,
  TileGrid,
} from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Card',
    layer: 'components',
    category: 'Composition',
    order: 90,
    summary:
      'Product-neutral content container with optional leading, title, description, actions and footer regions.',
    usage:
      'Use when repeated Surface + heading/action assembly would otherwise leak into application code; keep product state outside the card.',
    status: 'candidate',
    accessibility:
      'Associates title and description with the grouped card when supplied and preserves child semantics.',
    rtl: 'Leading/actions/footer regions use logical layout and inherit bidi direction.',
    touch:
      'Interactive children retain their own touch targets; Card itself does not invent pointer behavior.',
    responsive: 'Header/actions wrap and content remains container-bound at narrow widths.',
    examples: [{ id: 'overview', title: 'Content containers', component: 'ContainersExample' }],
  },
  {
    exportName: 'Disclosure',
    layer: 'components',
    category: 'Composition',
    order: 90,
    summary:
      'React-owned expandable content composition with explicit button/region state authority.',
    usage:
      'Use for one independently expandable section; use Accordion for coordinated peer sections.',
    status: 'accepted',
    accessibility:
      'Uses a native button inside a semantic heading with aria-expanded/aria-controls and a labelled region; controlled state never races native details mutation.',
    rtl: 'The directional chevron mirrors semantically in RTL and copy uses logical flow.',
    touch: 'The disclosure button keeps a full touch-friendly activation row.',
    responsive: 'Description and content wrap without viewport assumptions.',
    examples: [
      {
        id: 'disclosure-contract',
        title: 'Disclosure heading + region',
        component: 'DisclosureContractExample',
      },
    ],
  },
  {
    exportName: 'Accordion',
    layer: 'components',
    category: 'Composition',
    order: 90,
    summary:
      'Single- or multi-expand disclosure collection with controlled/uncontrolled value ownership.',
    usage: 'Use for peer disclosure sections; do not use as application navigation.',
    status: 'accepted',
    accessibility:
      'Each item uses a semantic heading plus button/region pair; ArrowUp/Down/Home/End move between enabled headers and single/multiple state is normalized.',
    rtl: 'Logical ordering and mirrored disclosure indicators work in either direction.',
    touch: 'Each disclosure button is a full touch target.',
    responsive: 'Sections fill their containing width and copy wraps naturally.',
    playground: {
      preferredWidth: 'medium',
      controls: ['multiple'],
      fixture: {
        items: [
          { value: 'first', summary: 'First section', content: 'First section content' },
          { value: 'second', summary: 'Second section', content: 'Second section content' },
        ],
        defaultValue: ['first'],
      },
    },
    examples: [
      {
        id: 'accordion-contract',
        title: 'Accordion state + keyboard contract',
        component: 'AccordionContractExample',
      },
    ],
  },
  {
    exportName: 'PageScaffold',
    layer: 'components',
    category: 'Composition',
    order: 90,
    summary:
      'Generic application page scaffold with header, sidebar, content, footer and named inset slots.',
    usage:
      'Use for ordinary developer application structure; OXS workspace/system-surface scaffolds remain System UI responsibilities.',
    status: 'candidate',
    accessibility:
      'Uses main/aside/footer landmarks while leaving caller-provided header semantics intact.',
    rtl: 'Sidebar start/end placement is logical and swaps naturally under RTL.',
    touch: 'Does not shrink child controls or create hover-only access.',
    responsive:
      'Container-driven layout collapses the sidebar into stacked flow in constrained space.',
    examples: [{ id: 'overview', title: 'Application scaffold', component: 'ScaffoldExample' }],
  },
  {
    exportName: 'TileGrid',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary: 'Responsive collection grid for tiles/application items with named density contracts.',
    usage:
      'Use for reusable tile collections; Launcher composition and product filtering remain System UI/application responsibilities.',
    status: 'accepted',
    accessibility:
      'A labelled group keeps one roving Tab entry when spatial navigation is enabled; owner-realm geometry chooses the nearest enabled tile for arrows/Home/End.',
    rtl: 'Grid placement follows logical direction and horizontal spatial arrows reverse logically.',
    touch: 'Grid sizing keeps interactive tiles large enough for coarse pointers.',
    responsive:
      'Columns derive from actual container width through CSS grid rather than device detection.',
    examples: [
      {
        id: 'spatial-grid',
        title: 'Measured spatial tile navigation',
        component: 'TileGridContractExample',
      },
    ],
  },
  {
    exportName: 'Tile',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary:
      'Generic static or actionable tile with copy, leading/trailing content, badge and selected/pending states.',
    usage: 'Use where list rows are too linear and a grid-friendly item is appropriate.',
    status: 'accepted',
    accessibility:
      'Actionable tiles use shared Button semantics with trailing controls kept as siblings; selection is visual by default or can explicitly expose aria-current.',
    rtl: 'Leading/trailing and copy order are logical.',
    touch: 'Actionable tiles use shared Button press and minimum-target behavior.',
    responsive: 'Long/localized copy remains bounded inside responsive TileGrid columns.',
    examples: [
      {
        id: 'spatial-grid',
        title: 'Measured spatial tile navigation',
        component: 'TileGridContractExample',
      },
    ],
  },
  {
    exportName: 'ApplicationItem',
    layer: 'components',
    category: 'Data & collection',
    order: 50,
    summary:
      'Reusable application identity tile separated from Launcher-specific state and layout.',
    usage:
      'Use with TileGrid for application collections; Launcher search, open/close state and launch policy stay outside this Component.',
    status: 'candidate',
    accessibility:
      'The visible application name is the action name; image icons remain decorative unless the caller provides separate meaning.',
    rtl: 'Name/metadata placement follows logical tile flow.',
    touch: 'Uses the shared Tile/Button interaction contract.',
    responsive: 'Application identity remains bounded across compact and roomy tile grids.',
    examples: [{ id: 'overview', title: 'Tiles + application items', component: 'TileExample' }],
  },
  {
    exportName: 'ContentState',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary:
      'Shared empty, error and loading composition with icon/status/actions slots and no product copy ownership.',
    usage:
      'Use for collection/page state replacement; supply application-specific title, description and actions.',
    status: 'candidate',
    accessibility:
      'Error state uses alert semantics, loading uses status semantics, and empty state stays neutral unless caller overrides role.',
    rtl: 'Centered or logical copy remains bidi-safe.',
    touch: 'Actions preserve their own shared touch contracts.',
    responsive: 'State copy and actions wrap within the containing region.',
    examples: [{ id: 'overview', title: 'Content states', component: 'StateExample' }],
  },
] as const);

export function ContainersExample() {
  return (
    <div className="ui-doc-composition-stack">
      <Card
        title="Project summary"
        description="Reusable developer content"
        actions={<Button size="sm">Open</Button>}
      >
        Generic card content remains product-neutral.
      </Card>
      <Disclosure
        summary="Advanced options"
        description="React-owned keyboard, touch and controlled-state semantics"
      >
        Disclosure content can contain any Component-level form or navigation UI.
      </Disclosure>
      <Accordion
        label="Preferences"
        items={[
          {
            value: 'appearance',
            summary: 'Appearance',
            content: 'Theme, density and typography settings.',
          },
          {
            value: 'behavior',
            summary: 'Behavior',
            content: 'Interaction and motion preferences.',
          },
        ]}
      />
    </div>
  );
}

export function DisclosureContractExample() {
  const [open, setOpen] = useState(false);
  return (
    <Disclosure
      summary="Advanced options"
      description="Controlled disclosure with semantic heading and labelled region."
      open={open}
      onOpenChange={setOpen}
      headingLevel={3}
    >
      Disclosure content remains mounted only while open and never owns product state.
    </Disclosure>
  );
}

export function AccordionContractExample() {
  const [open, setOpen] = useState<readonly string[]>(['appearance']);
  return (
    <Accordion
      label="Preferences"
      value={open}
      onValueChange={setOpen}
      items={[
        { value: 'appearance', summary: 'Appearance', content: 'Theme and density settings.' },
        {
          value: 'disabled',
          summary: 'Unavailable',
          content: 'Unavailable content.',
          disabled: true,
        },
        { value: 'behavior', summary: 'Behavior', content: 'Interaction preferences.' },
      ]}
    />
  );
}

export function ScaffoldExample() {
  return (
    <PageScaffold
      className="ui-doc-scaffold"
      header={<Card padding="sm" title="Developer page" description="Header slot" />}
      sidebar={
        <Card padding="sm" title="Sections">
          <Button fullWidth variant="secondary">
            Overview
          </Button>
        </Card>
      }
      footer={<span>Footer slot</span>}
      contentLabel="Scaffold example content"
    >
      <Card title="Main content" description="Container-driven sidebar collapse">
        <ScrollView className="ui-doc-composition-scroll" ariaLabel="Scaffold scroll preview">
          Reusable application content goes here.
        </ScrollView>
      </Card>
    </PageScaffold>
  );
}

export function TileExample() {
  const [selected, setSelected] = useState('browser');
  return (
    <TileGrid label="Example applications">
      <ApplicationItem
        name="Browser"
        icon="browser"
        selected={selected === 'browser'}
        onActivate={() => setSelected('browser')}
        badge={<Badge tone="accent">2</Badge>}
      />
      <ApplicationItem
        name="Files"
        icon="files"
        selected={selected === 'files'}
        onActivate={() => setSelected('files')}
      />
      <Tile
        title="Reusable tile"
        description="Not application-specific"
        leading={<Icon name="settings" />}
      />
    </TileGrid>
  );
}

export function TileGridContractExample() {
  const [selected, setSelected] = useState('alpha');
  const [reversed, setReversed] = useState(false);
  const tiles = reversed
    ? [
        { id: 'gamma', title: 'Gamma', description: 'Third enabled target' },
        { id: 'beta', title: 'Beta', description: 'Second measured target' },
        {
          id: 'alpha',
          title: 'Alpha / آلفا',
          description: 'Long localized content remains bounded and focus survives reorder.',
        },
      ]
    : [
        {
          id: 'alpha',
          title: 'Alpha / آلفا',
          description: 'Long localized content remains bounded and focus survives reorder.',
        },
        { id: 'beta', title: 'Beta', description: 'Second measured target' },
        { id: 'gamma', title: 'Gamma', description: 'Third enabled target' },
      ];
  return (
    <div className="ui-doc-composition-stack">
      <Button size="sm" data-tile-reorder onClick={() => setReversed((value) => !value)}>
        Reorder tiles
      </Button>
      <TileGrid label="Projects" keyboardNavigation density="comfortable">
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            title={tile.title}
            description={tile.description}
            selected={selected === tile.id}
            selectionSemantics={tile.id === 'alpha' ? 'current' : 'visual'}
            onActivate={() => setSelected(tile.id)}
            trailing={
              tile.id === 'beta' ? (
                <Button size="sm" aria-label="More Beta actions">
                  More
                </Button>
              ) : undefined
            }
          />
        ))}
        <Tile
          title="Disabled"
          description="Skipped by roving focus"
          disabled
          onActivate={() => setSelected('disabled')}
        />
      </TileGrid>
    </div>
  );
}

export function StateExample() {
  return (
    <div className="ui-doc-composition-stack">
      <ContentState
        kind="empty"
        title="No items"
        description="Add an item when you are ready."
        actions={<Button size="sm">Create</Button>}
      />
      <ContentState
        kind="error"
        title="Could not load"
        description="The caller owns retry policy and copy."
        actions={
          <Button size="sm" intent="destructive">
            Retry
          </Button>
        }
      />
      <ContentState
        kind="loading"
        title="Loading content"
        description="Shared status semantics without product-specific progress policy."
      />
    </div>
  );
}
