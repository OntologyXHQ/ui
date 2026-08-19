export type SelectionCandidate<T extends string = string> = {
  value: T;
  disabled?: boolean;
};

export type SelectionFallback = 'first-enabled' | 'none';

/** Normalizes a requested single selection against the currently enabled collection. */
export function normalizeSingleSelection<T extends string>(
  items: readonly SelectionCandidate<T>[],
  requested: T | undefined,
  fallback: SelectionFallback = 'first-enabled',
): T | undefined {
  if (requested !== undefined && items.some((item) => item.value === requested && !item.disabled)) {
    return requested;
  }
  if (fallback === 'none') return undefined;
  return items.find((item) => !item.disabled)?.value;
}
