import { useCallback, useState } from 'react';

export type ControllableStateOptions<T> = {
  value?: T;
  defaultValue: T;
  onValueChange?: (value: T) => void;
};

export function useControllableState<T>({
  value,
  defaultValue,
  onValueChange,
}: ControllableStateOptions<T>) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internalValue;

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      if (Object.is(resolved, current)) return;
      if (!controlled) setInternalValue(resolved);
      onValueChange?.(resolved);
    },
    [controlled, current, onValueChange],
  );

  return [current, setValue] as const;
}
