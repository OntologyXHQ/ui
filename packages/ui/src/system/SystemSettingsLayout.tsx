import type { ReactNode } from 'react';
import type { NavigationItem } from '../components';
import { AdaptiveNavigation, AppBar, PageScaffold, ScrollView } from '../components';

export type SystemSettingsLayoutProps = {
  /** Caller-owned visible title; reusable UI never supplies product meaning. */
  title?: ReactNode;
  /** Optional caller-owned supporting title text. */
  subtitle?: ReactNode;
  /** Accessible name for settings navigation. */
  navigationLabel?: string;
  /** Accessible name for the primary reusable content region. */
  contentLabel?: string;
  /** Caller-owned ordered section models for this reusable System composition. */
  sections: readonly NavigationItem[];
  /** Controlled value; caller remains authoritative when supplied. */
  value?: string;
  /** Initial uncontrolled value used only when no controlled value is supplied. */
  defaultValue?: string;
  /** Reports committed value changes to controlled or observing callers. */
  onValueChange?: (value: string) => void;
  /** Optional caller-owned action region composed from public Components. */
  actions?: ReactNode;
  /** Caller-owned content rendered inside this reusable visual boundary. */
  children: ReactNode;
  /** Optional consumer class name appended without changing component ownership. */
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
