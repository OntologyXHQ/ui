import type { ReactNode } from 'react';
import type { NavigationItem } from '../components';
import { AdaptiveNavigation, AppBar, PageScaffold, ScrollView } from '../components';

export type SystemSettingsLayoutProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  navigationLabel?: string;
  contentLabel?: string;
  sections: readonly NavigationItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SystemSettingsLayout({
  title = 'Settings',
  subtitle,
  navigationLabel = 'Settings sections',
  contentLabel,
  sections,
  value,
  defaultValue,
  onValueChange,
  actions,
  children,
  className = '',
}: SystemSettingsLayoutProps) {
  const resolvedContentLabel =
    contentLabel ?? (typeof title === 'string' ? `${title} content` : 'Settings content');
  return (
    <PageScaffold
      className={`ui-system-settings-layout ${className}`.trim()}
      inset="none"
      header={<AppBar title={title} subtitle={subtitle} actions={actions} />}
      sidebar={
        <AdaptiveNavigation
          className="ui-system-settings-layout__navigation"
          label={navigationLabel}
          items={sections}
          mode="auto"
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
        />
      }
      contentLabel={resolvedContentLabel}
    >
      <ScrollView
        className="ui-system-settings-layout__content-scroll"
        ariaLabel={resolvedContentLabel}
      >
        {children}
      </ScrollView>
    </PageScaffold>
  );
}
