import type { ReactNode } from 'react';
import { AppBar, Badge, Card, ContentState, List, ListItem, ScrollView } from '../components';

export type SystemNotificationItem = {
  id: string;
  title: ReactNode;
  body?: ReactNode;
  metadata?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  unread?: boolean;
  onActivate?: () => void;
};

export type SystemNotificationCenterProps = {
  /** Caller-owned visible title; reusable UI never supplies product meaning. */
  title?: ReactNode;
  /** Caller-owned notification view models; delivery and persistence remain external. */
  items: readonly SystemNotificationItem[];
  /** Optional caller-owned action region composed from public Components. */
  actions?: ReactNode;
  /** Accessible landmark label for the notification center. */
  label?: string;
  /** Accessible name for the rendered collection. */
  collectionLabel?: string;
  /** Caller-owned unread-state label. */
  unreadLabel?: ReactNode;
  /** Caller-owned empty-state title. */
  emptyTitle?: ReactNode;
  /** Caller-owned empty-state supporting description. */
  emptyDescription?: ReactNode;
  /** Optional consumer class name appended without changing component ownership. */
  className?: string;
};

export function SystemNotificationCenter({
  title = 'Notifications',
  items,
  actions,
  label = 'Notification center',
  collectionLabel = 'Notifications',
  unreadLabel = 'New',
  emptyTitle = 'No notifications',
  emptyDescription = 'New notifications will appear here.',
  className = '',
}: SystemNotificationCenterProps) {
  return (
    <section className={`ui-system-notification-center ${className}`.trim()} aria-label={label}>
      <AppBar title={title} actions={actions} />
      <ScrollView className="ui-system-notification-center__scroll" ariaLabel={collectionLabel}>
        {items.length > 0 ? (
          <List label={collectionLabel} divided>
            {items.map((item) => (
              <ListItem
                key={item.id}
                primary={item.title}
                secondary={item.body}
                metadata={item.metadata}
                leading={item.leading}
                trailing={
                  item.trailing ??
                  (item.unread ? <Badge tone="accent">{unreadLabel}</Badge> : undefined)
                }
                onActivate={item.onActivate}
              />
            ))}
          </List>
        ) : (
          <ContentState kind="empty" title={emptyTitle} description={emptyDescription} />
        )}
      </ScrollView>
    </section>
  );
}

export type SystemQuickSettingSection = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
};

export type SystemQuickSettingsProps = {
  /** Caller-owned visible title; reusable UI never supplies product meaning. */
  title?: ReactNode;
  /** Optional caller-owned supporting title text. */
  subtitle?: ReactNode;
  /** Caller-owned ordered section models for this reusable System composition. */
  sections: readonly SystemQuickSettingSection[];
  /** Optional caller-owned action region composed from public Components. */
  actions?: ReactNode;
  /** Accessible landmark label for the quick-settings composition. */
  label?: string;
  /** Optional consumer class name appended without changing component ownership. */
  className?: string;
};

export function SystemQuickSettings({
  title = 'Quick settings',
  subtitle,
  sections,
  actions,
  label = 'Quick settings',
  className = '',
}: SystemQuickSettingsProps) {
  return (
    <section className={`ui-system-quick-settings ${className}`.trim()} aria-label={label}>
      <AppBar title={title} subtitle={subtitle} actions={actions} />
      <ScrollView className="ui-system-quick-settings__scroll" ariaLabel={label}>
        <div className="ui-system-quick-settings__grid">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="ui-system-quick-settings__section"
              title={section.title}
              description={section.description}
              actions={section.actions}
              padding="sm"
            >
              {section.content}
            </Card>
          ))}
        </div>
      </ScrollView>
    </section>
  );
}
