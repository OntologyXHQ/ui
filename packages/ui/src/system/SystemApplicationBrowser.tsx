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
  title?: ReactNode;
  subtitle?: ReactNode;
  query: string;
  apps: readonly SystemApplicationItem[];
  onQueryChange: (query: string) => void;
  onActivate: (id: string) => void;
  pendingApplicationId?: string | null;
  presentation?: 'grid' | 'list';
  actions?: ReactNode;
  searchLabel?: string;
  searchPlaceholder?: string;
  browserLabel?: string;
  collectionLabel?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  interactive?: boolean;
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
