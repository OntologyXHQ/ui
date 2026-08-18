export const UI_CUSTOMIZABLE_TOKENS = [
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
  'color-on-accent',
  'color-accent-soft',
  'color-accent-glow',
  'color-focus',
  'color-danger',
  'color-success',
  'color-warning',
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
  'space-3xs',
  'space-2xs',
  'space-xs',
  'space-sm',
  'space-md',
  'space-lg',
  'space-xl',
  'space-2xl',
  'radius-sm',
  'radius-md',
  'radius-lg',
  'radius-xl',
  'radius-full',
  'material-blur',
  'material-saturation',
  'elevation-1',
  'elevation-2',
  'elevation-3',
  'layout-gutter',
  'layout-gap',
  'layout-content',
  'layout-wide',
  'focus-ring-width',
  'focus-ring-offset',
] as const;

export type UiCustomizableToken = (typeof UI_CUSTOMIZABLE_TOKENS)[number];
export type UiTokenValue = string | number;
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
