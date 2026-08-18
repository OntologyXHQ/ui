import { AppBar, Button } from '@oxs/ui';

export type StudioView =
  | 'catalog'
  | 'foundations'
  | 'interaction'
  | 'runtime'
  | 'primitives'
  | 'actions'
  | 'fields'
  | 'data'
  | 'overlays'
  | 'compositions'
  | 'system'
  | 'layouts'
  | 'audit'
  | 'spine'
  | 'gallery';

function openWorkbench() {
  const url = new URL(window.location.href);
  url.searchParams.set('ui-kit', '1');
  url.searchParams.set('view', 'catalog');
  url.searchParams.delete('entry');
  window.location.assign(url.toString());
}

/**
 * Compatibility header for historical diagnostic pages that still compile in Studio.
 * UIP13 removed the old parallel hand-maintained menu; generated catalog navigation
 * is owned exclusively by the main workbench.
 */
export function StudioNav({ current }: { current: StudioView }) {
  return (
    <AppBar
      className="ui-studio-nav"
      title="OXS UI Studio"
      subtitle={`${current} · legacy diagnostic page`}
      actions={
        <Button size="sm" variant="soft" onClick={openWorkbench}>
          Open generated workbench
        </Button>
      }
    />
  );
}
