import { Banner, Button, Snackbar, Stack, ToastHost, useToastQueue } from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Snackbar',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Compact transient message with optional action and dismissal.',
    usage: 'Use for short-lived app feedback; persistent or structural messages belong in Banner.',
    status: 'accepted',
    accessibility:
      'Uses status/alert semantics based on tone, keeps actions keyboard reachable, and lets callers localize both dismiss label and visible dismiss text.',
    rtl: 'Copy and actions use logical flow.',
    touch:
      'Actions use shared Button targets and the toast host pauses timeout during interaction.',
    responsive: 'Width clamps to available inline space.',
    examples: [{ id: 'overview', title: 'Snackbar', component: 'SnackbarExample' }],
  },
  {
    exportName: 'ToastHost',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Safe-area-aware transient feedback host with timeout and pause behavior.',
    usage:
      'Mount once in an application scope and feed it a controlled queue or useToastQueue result. Reusing an explicit toast id replaces that queue entry instead of creating duplicate keys.',
    status: 'accepted',
    accessibility:
      'Announces additions through a polite live region while danger messages use alert semantics.',
    rtl: 'Placement uses logical inline-end and message layout follows writing direction.',
    touch: 'Pointer/focus interaction pauses auto-dismiss so actions are not time pressured.',
    responsive: 'Host width clamps on narrow containers and respects safe-area tokens.',
    playground: {
      preferredWidth: 'medium',
      fixture: { items: [{ id: 'ready', message: 'Ready', durationMs: 60000 }] },
    },
    examples: [{ id: 'overview', title: 'Toast queue', component: 'ToastQueueExample' }],
  },
  {
    exportName: 'Banner',
    layer: 'components',
    category: 'Feedback',
    order: 60,
    summary: 'Persistent inline feedback message with optional action and dismissal.',
    usage: 'Use when feedback must remain visible in document flow until addressed or dismissed.',
    status: 'accepted',
    accessibility:
      'Uses status/alert semantics, keeps action/dismiss controls in normal focus order, and exposes caller-owned dismiss label/text for localization.',
    rtl: 'Layout uses logical flow and wraps without physical positioning.',
    touch: 'Actions inherit the shared Button target policy.',
    responsive: 'Copy and actions wrap into a single-column composition when space is constrained.',
    examples: [{ id: 'overview', title: 'Banner', component: 'BannerExample' }],
  },
]);

export function SnackbarExample() {
  return <Snackbar message="Changes saved" action={{ label: 'Undo', onAction: () => {} }} />;
}

export function ToastQueueExample() {
  const queue = useToastQueue();
  return (
    <Stack gap="sm">
      <Button onClick={() => queue.push({ message: 'Background sync completed', tone: 'success' })}>
        Push toast
      </Button>
      <ToastHost items={queue.toasts} onDismiss={queue.dismiss} />
    </Stack>
  );
}

export function BannerExample() {
  const [visible, setVisible] = useState(true);
  return visible ? (
    <Banner
      message="A newer version is available."
      action={{ label: 'Review', onAction: () => {} }}
      onDismiss={() => setVisible(false)}
    />
  ) : (
    <Button onClick={() => setVisible(true)}>Show banner</Button>
  );
}
