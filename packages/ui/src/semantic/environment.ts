import type { UiSemanticId } from './model';

export type UiResolverContainer = 'compact' | 'regular' | 'wide';
export type UiResolverModality = 'keyboard' | 'mouse' | 'touch' | 'pen';
export type UiResolverDensity = 'compact' | 'comfortable';
export type UiResolverDirection = 'ltr' | 'rtl';
export type UiResolverPointerPrecision = 'fine' | 'coarse';
export type UiResolverCapability = UiSemanticId;

/**
 * Resolved host environment consumed by semantic presentation policy.
 * Preferences such as `auto`, viewport names and device identities never enter Runtime IR.
 */
export type UiResolverEnvironment = Readonly<{
  container: UiResolverContainer;
  modality: UiResolverModality;
  density: UiResolverDensity;
  direction: UiResolverDirection;
  pointerPrecision: UiResolverPointerPrecision;
  capabilities: readonly UiResolverCapability[];
}>;

export type UiResolverEnvironmentInput = Omit<UiResolverEnvironment, 'capabilities'> & {
  capabilities?: readonly UiResolverCapability[];
};

export const DEFAULT_UI_RESOLVER_ENVIRONMENT: UiResolverEnvironment = Object.freeze({
  container: 'regular',
  modality: 'mouse',
  density: 'comfortable',
  direction: 'ltr',
  pointerPrecision: 'fine',
  capabilities: Object.freeze([]),
});

export function createUiResolverEnvironment(
  input: UiResolverEnvironmentInput,
): UiResolverEnvironment {
  assertResolverValue('container', input.container, ['compact', 'regular', 'wide']);
  assertResolverValue('modality', input.modality, ['keyboard', 'mouse', 'touch', 'pen']);
  assertResolverValue('density', input.density, ['compact', 'comfortable']);
  assertResolverValue('direction', input.direction, ['ltr', 'rtl']);
  assertResolverValue('pointerPrecision', input.pointerPrecision, ['fine', 'coarse']);

  const capabilities = [...new Set(input.capabilities ?? [])];
  for (const capability of capabilities) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/u.test(capability)) {
      throw new Error(`Invalid UI resolver capability id: ${capability}`);
    }
  }

  return Object.freeze({
    container: input.container,
    modality: input.modality,
    density: input.density,
    direction: input.direction,
    pointerPrecision: input.pointerPrecision,
    capabilities: Object.freeze(capabilities),
  });
}

function assertResolverValue(name: string, value: string, allowed: readonly string[]): void {
  if (!allowed.includes(value)) {
    throw new Error(`Invalid UI resolver ${name}: ${value}`);
  }
}
