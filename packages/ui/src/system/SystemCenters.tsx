import type { ReactNode } from 'react';
import {
  AppBar,
  Badge,
  Card,
  ContentState,
  List,
  ListItem,
  ScrollView,
} from '../components';

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
  title?: ReactNode;
  items: readonly SystemNotificationItem[];
  actions?: ReactNode;
  label?: string;
  collectionLabel?: string;
  unreadLabel?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
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
                trailing={item.trailing ?? (item.unread ? <Badge tone="accent">{unreadLabel}</Badge> : undefined)}
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
  title?: ReactNode;
  subtitle?: ReactNode;
  sections: readonly SystemQuickSettingSection[];
  actions?: ReactNode;
  label?: string;
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
