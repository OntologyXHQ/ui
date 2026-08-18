import { usePress } from '../interaction/press';

export type PressGestureOptions = {
  disabled?: boolean;
  onPress?: () => void;
  onPressChange?: (pressed: boolean) => void;
};

export function usePressGesture(options: PressGestureOptions = {}) {
  const press = usePress({
    disabled: options.disabled,
    onPress: () => options.onPress?.(),
    onPressChange: options.onPressChange,
  });

  return {
    gestureProps: press.pressProps,
    isPressed: () => press.pressed,
  };
}
