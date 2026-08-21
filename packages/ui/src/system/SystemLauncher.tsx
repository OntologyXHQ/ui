import { useCallback, useEffect, useState } from 'react';
import type { BottomSheetProps } from '../components';
import { BottomSheet } from '../components';
import type { SystemApplicationItem } from './SystemApplicationBrowser';
import { filterSystemApplicationItems, SystemApplicationBrowser } from './SystemApplicationBrowser';

export type SystemLauncherItem = SystemApplicationItem;

export type SystemLauncherProps = {
  /** Caller-owned controlled visibility state for this System surface. */
  open: boolean;
  /** Optional shared BottomSheet transition descriptor; motion policy remains UiRoot-owned. */
  transition?: BottomSheetProps['transition'];
  /** Caller-owned search/filter query. */
  query: string;
  /** Caller-owned application view models; routing and launch authority remain external. */
  apps: readonly SystemLauncherItem[];
  /** Reports query changes without taking ownership of filtering policy. */
  onQueryChange: (query: string) => void;
  /** Requests launch by stable application identity and returns caller policy outcome. */
  onLaunch: (id: string) => boolean;
  /** Requests closure while visibility ownership remains with the caller. */
  onClose: () => void;
  /** Container-friendly collection presentation without device detection. */
  presentation?: 'grid' | 'list';
};

export function filterSystemLauncherItems(
  apps: readonly SystemLauncherItem[],
  query: string,
): SystemLauncherItem[] {
  return filterSystemApplicationItems(apps, query);
}

export function SystemLauncher({
  open,
  transition,
  query,
  apps,
  onQueryChange,
  onLaunch,
  onClose,
  presentation = 'grid',
}: SystemLauncherProps) {
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setPendingApplicationId(null);
  }, [open]);

  const activateApplication = useCallback(
    (id: string) => {
      if (pendingApplicationId) return;
      if (onLaunch(id)) setPendingApplicationId(id);
    },
    [onLaunch, pendingApplicationId],
  );

  return (
    <BottomSheet
      open={open}
      transition={transition}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      ariaLabel="Application launcher"
      layerClassName="ui-system-launcher-layer"
      panelClassName="ui-system-launcher"
      scrimClassName="ui-system-launcher__scrim"
      autoFocus
    >
      <SystemApplicationBrowser
        className="ui-system-launcher__browser"
        query={query}
        apps={apps}
        presentation={presentation}
        pendingApplicationId={pendingApplicationId}
        onQueryChange={onQueryChange}
        onActivate={activateApplication}
        interactive={open}
      />
    </BottomSheet>
  );
}
