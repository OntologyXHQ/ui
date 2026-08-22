import type { ReactNode } from 'react';
import type { ApplicationItemIcon } from '../components';
import {
  AppBar,
  ApplicationItem,
  ContentState,
  List,
  ScrollView,
  SearchField,
  TileGrid,
} from '../components';

export type SystemApplicationItem = {
  id: string;
  name: string;
  icon: ApplicationItemIcon;
  keywords?: readonly string[];
  description?: ReactNode;
};

export type SystemApplicationBrowserProps = {
  /** Caller-owned visible title; reusable UI never supplies product meaning. */
  title?: ReactNode;
  /** Optional caller-owned supporting title text. */
  subtitle?: ReactNode;
  /** Caller-owned search/filter query. */
  query: string;
  /** Caller-owned candidate application view models; sourcing/ranking/routing authority remains external. */
  apps: readonly SystemApplicationItem[];
  /** Reports the controlled query; the layout applies only its documented deterministic text match. */
  onQueryChange: (query: string) => void;
  /** Reports activation by stable identity; execution authority remains external. */
  onActivate: (id: string) => void;
  /** Stable application identity currently awaiting caller-owned launch completion. */
  pendingApplicationId?: string | null;
  /** Container-friendly collection presentation without device detection. */
  presentation?: 'grid' | 'list';
  /** Optional caller-owned action region composed from public Components. */
  actions?: ReactNode;
  /** Accessible name for the search field. */
  searchLabel?: string;
  /** Optional search-field placeholder; never used as the accessible name. */
  searchPlaceholder?: string;
  /** Accessible name for the application-browser region. */
  browserLabel?: string;
  /** Accessible name for the rendered collection. */
  collectionLabel?: string;
  /** Caller-owned empty-state title. */
  emptyTitle?: ReactNode;
  /** Caller-owned empty-state supporting description. */
  emptyDescription?: ReactNode;
  /** Whether search and activation are enabled while preserving visible structure. */
  interactive?: boolean;
  /** Optional consumer class name appended without changing component ownership. */
  className?: string;
};

export function SystemApplicationBrowser({
  title = 'Applications',
  subtitle = 'What do you want to open?',
  query,
  apps,
  onQueryChange,
  onActivate,
  pendingApplicationId = null,
  presentation = 'grid',
  actions,
  searchLabel = 'Search applications',
  searchPlaceholder = 'Search apps',
  browserLabel = 'Application browser',
  collectionLabel = 'Applications',
  emptyTitle = 'No applications found',
  emptyDescription = 'No applications match your search.',
  interactive = true,
  className = '',
}: SystemApplicationBrowserProps) {
  const visibleApps = filterSystemApplicationItems(apps, query);
  const items = visibleApps.map((app) => (
    <ApplicationItem
      key={app.id}
      role={presentation === 'list' ? 'listitem' : undefined}
      className={presentation === 'list' ? 'ui-system-application-browser__list-item' : undefined}
      name={app.name}
      icon={app.icon}
      description={app.description}
      pending={pendingApplicationId === app.id}
      disabled={!interactive || (pendingApplicationId !== null && pendingApplicationId !== app.id)}
      onActivate={() => onActivate(app.id)}
      data-oxs-application-id={app.id}
    />
  ));

  return (
    <section
      className={`ui-system-application-browser ${className}`.trim()}
      aria-label={browserLabel}
    >
      <div className="ui-system-application-browser__header">
        <AppBar title={title} subtitle={subtitle} actions={actions} />
        <SearchField
          hideLabel
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={query}
          onValueChange={onQueryChange}
          disabled={!interactive}
          clearTabIndex={interactive ? 0 : -1}
          autoComplete="off"
          spellCheck={false}
          data-autofocus
        />
      </div>
      <ScrollView
        className="ui-system-application-browser__scroll"
        ariaLabel={collectionLabel}
        keyboard={interactive}
        overscroll="elastic"
      >
        {visibleApps.length === 0 ? (
          <ContentState kind="empty" title={emptyTitle} description={emptyDescription} />
        ) : presentation === 'grid' ? (
          <TileGrid
            label={collectionLabel}
            className="ui-system-application-browser__grid"
            keyboardNavigation={interactive}
          >
            {items}
          </TileGrid>
        ) : (
          <List label={collectionLabel} className="ui-system-application-browser__list">
            {items}
          </List>
        )}
      </ScrollView>
    </section>
  );
}

export function filterSystemApplicationItems(
  apps: readonly SystemApplicationItem[],
  query: string,
) {
  const tokens = normalizeSearchText(query).split(/\s+/u).filter(Boolean);
  if (tokens.length === 0) return [...apps];
  return apps.filter((app) => {
    const haystack = normalizeSearchText(
      [
        app.name,
        app.id,
        typeof app.description === 'string' ? app.description : '',
        ...(app.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' '),
    );
    return tokens.every((token) => haystack.includes(token));
  });
}

function normalizeSearchText(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase();
}
