/**
 * Stable semantic token groups that a consumer may override at a UiRoot boundary.
 * Runtime-only mechanics (z-order, gesture physics, scroll physics, safe-area plumbing,
 * control geometry) intentionally stay out of this public theme contract.
 */
export const UI_TOKEN_GROUPS = {
  color: [
    'color-canvas',
    'color-canvas-raised',
    'color-surface',
    'color-surface-strong',
    'color-surface-subtle',
    'color-control',
    'color-control-hover',
    'color-control-pressed',
    'color-field-bg',
    'color-text-primary',
    'color-text-secondary',
    'color-text-tertiary',
    'color-border-subtle',
    'color-border',
    'color-border-strong',
    'color-accent',
    'color-accent-hover',
    'color-accent-pressed',
    'color-accent-text',
    'color-on-accent',
    'color-accent-soft',
    'color-accent-border',
    'color-focus',
    'color-danger',
    'color-danger-text',
    'color-on-danger',
    'color-danger-soft',
    'color-danger-hover',
    'color-danger-border',
    'color-success',
    'color-success-text',
    'color-on-success',
    'color-success-soft',
    'color-success-border',
    'color-warning',
    'color-warning-text',
    'color-on-warning',
    'color-warning-soft',
    'color-warning-border',
    'color-handle',
    'color-handle-muted',
    'color-scroll-indicator',
    'color-scrim',
    'color-scrim-strong',
  ],
  typography: [
    'font-sans',
    'font-mono',
    'type-display-size',
    'type-title-size',
    'type-heading-size',
    'type-body-size',
    'type-caption-size',
    'type-label-size',
    'weight-regular',
    'weight-medium',
    'weight-strong',
  ],
  spacing: [
    'space-3xs',
    'space-2xs',
    'space-xs',
    'space-sm',
    'space-md',
    'space-lg',
    'space-xl',
    'space-2xl',
  ],
  shape: [
    'radius-sm',
    'radius-md',
    'radius-lg',
    'radius-xl',
    'radius-full',
  ],
  material: [
    'material-blur',
    'material-saturation',
    'elevation-1',
    'elevation-2',
    'elevation-3',
  ],
  layout: [
    'layout-gutter',
    'layout-gap',
    'layout-content',
    'layout-wide',
  ],
  focus: [
    'focus-ring-width',
    'focus-ring-offset',
  ],
} as const;

export type UiTokenGroup = keyof typeof UI_TOKEN_GROUPS;
export type UiCustomizableToken = (typeof UI_TOKEN_GROUPS)[UiTokenGroup][number];

export const UI_CUSTOMIZABLE_TOKENS: readonly UiCustomizableToken[] = Object.freeze(
  Object.values(UI_TOKEN_GROUPS).flat(),
);

/** CSS custom-property values are explicit strings; unitless numbers are not guessed. */
export type UiTokenValue = string;
export type UiTokenOverrides = Partial<Record<UiCustomizableToken, UiTokenValue>>;

export function uiTokenStyle(overrides: UiTokenOverrides | undefined): Record<string, UiTokenValue> {
  if (!overrides) return {};

  const style: Record<string, UiTokenValue> = {};
  for (const token of UI_CUSTOMIZABLE_TOKENS) {
    const value = overrides[token];
    if (value !== undefined) style[`--oxs-${token}`] = value;
  }
  return style;
}
