import { forwardRef } from 'react';
import {
  ScrollSnapItem as ScrollRuntimeSnapItem,
  ScrollView as ScrollRuntimeView,
  type ScrollSnapItemProps as ScrollRuntimeSnapItemProps,
  type ScrollViewHandle as ScrollRuntimeHandle,
  type ScrollViewProps as ScrollRuntimeProps,
} from '../scroll/ScrollView';

/** Developer-facing scroll handle backed by the shared scroll runtime. */
export type ScrollViewHandle = ScrollRuntimeHandle;
/** Developer-facing scroll props backed by the shared scroll runtime. */
export type ScrollViewProps = ScrollRuntimeProps;
/** Developer-facing snap item props backed by the shared scroll runtime. */
export type ScrollSnapItemProps = ScrollRuntimeSnapItemProps;

/**
 * Public Component-layer facade over the shared scroll runtime. Runtime physics,
 * gesture arbitration and nested-scroll ownership stay in the scroll service.
 */
export const ScrollView = forwardRef<ScrollViewHandle, ScrollViewProps>(
  function ScrollView(props, ref) {
    return <ScrollRuntimeView {...props} ref={ref} />;
  },
);

export function ScrollSnapItem(props: ScrollSnapItemProps) {
  return <ScrollRuntimeSnapItem {...props} />;
}
