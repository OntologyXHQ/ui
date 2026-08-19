import type {
  ButtonHTMLAttributes,
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  RefObject,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  cloneElement,
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { usePanGesture } from '../gestures';
import { useUiPortalHost, viewportPointToPortalHost } from '../foundations/portal';
import type { FloatingAnchor, FloatingGeometryRect, FloatingPlacement, PressActivation } from '../interaction';
import { focusRelativeTo, isTypeaheadCharacter, TypeaheadController, useFloatingPosition, useOverlayLifecycle, useRovingFocus } from '../interaction';
import type { InteractiveTransitionController } from '../motion';
import { useInteractiveTransition } from '../motion';
import { SafeArea, Surface } from '../primitives';
import { Button } from './Button';
import { Scrim } from './Scrim';

const OVERLAY_GAP = 8;
const VIEWPORT_MARGIN = 8;
const TOOLTIP_DELAY = 550;
const CONTEXT_LONG_PRESS_DELAY = 520;

export type DialogSize = 'sm' | 'md' | 'lg' | 'fullscreen';
type DialogName =
  | { title: ReactNode; ariaLabel?: string }
  | { title?: undefined; ariaLabel: string };
type DialogBaseProps = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description?: ReactNode;
  actions?: ReactNode;
  size?: DialogSize;
  modal?: boolean;
  dismissOnOutsidePress?: boolean;
  dismissOnEscape?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
  role?: 'dialog' | 'alertdialog';
}>;
export type DialogProps = DialogName & DialogBaseProps;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  actions,
  size = 'md',
  modal = true,
  dismissOnOutsidePress = true,
  dismissOnEscape = true,
  autoFocus = true,
  restoreFocus = true,
  className = '',
  role = 'dialog',
  ariaLabel,
  children,
}: DialogProps) {
  const portalHost = useUiPortalHost();
  const layerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const dismiss = useCallback(() => onOpenChangeRef.current(false), []);
  const overlay = useOverlayLifecycle({
    open: open && portalHost !== null,
    surfaceRef,
    layerRef,
    onDismiss: dismiss,
    modal,
    autoFocus,
    escape: dismissOnEscape,
    outsidePress: dismissOnOutsidePress,
    restoreFocus,
    lockScroll: modal,
  });

  useLayoutEffect(() => {
    layerRef.current?.style.setProperty('--oxs-overlay-depth', String(overlay.depth));
  }, [overlay.depth]);

  if (!open || !portalHost) return null;

  return createPortal(
    <div
      ref={layerRef}
      className="ui-dialog-layer"
      data-oxs-overlay-depth={overlay.depth}
      data-open="true"
    >
      {modal ? <Scrim active /> : null}
      <div className="ui-dialog-host">
        <Surface
          ref={surfaceRef}
          className={`ui-dialog ui-dialog--${size} ${className}`.trim()}
          material="glass"
          elevation={3}
          radius={size === 'fullscreen' ? 'none' : 'xl'}
          role={role}
          aria-modal={modal || undefined}
          aria-label={title ? undefined : ariaLabel}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
        >
          {title || description ? (
            <header className="ui-dialog__header">
              {title ? <h2 id={titleId} className="ui-dialog__title">{title}</h2> : null}
              {description ? <p id={descriptionId} className="ui-dialog__description">{description}</p> : null}
            </header>
          ) : null}
          <div className="ui-dialog__content">{children}</div>
          {actions ? <footer className="ui-dialog__actions">{actions}</footer> : null}
        </Surface>
      </div>
    </div>,
    portalHost,
  );
}

export type AlertDialogProps = DialogName &
  Omit<DialogBaseProps, 'actions' | 'role' | 'dismissOnOutsidePress'> & {
    confirmLabel: string;
    cancelLabel?: string;
    confirmTone?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel?: () => void;
  };

export function AlertDialog({
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmTone = 'default',
  onConfirm,
  onCancel,
  onOpenChange,
  ...props
}: AlertDialogProps) {
  const close = () => onOpenChange(false);
  return (
    <Dialog
      {...props}
      role="alertdialog"
      onOpenChange={onOpenChange}
      dismissOnOutsidePress={false}
      actions={
        <div className="ui-dialog__action-row">
          <Button
            onClick={() => {
              onCancel?.();
              close();
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            intent={confirmTone === 'danger' ? 'destructive' : 'neutral'}
            onClick={() => {
              onConfirm();
              close();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    />
  );
}

type OverlayAnchorProps =
  | { anchorRef: RefObject<HTMLElement | null>; anchorRect?: never }
  | { anchorRect: FloatingGeometryRect; anchorRef?: never };

export type PopoverProps = PropsWithChildren<OverlayAnchorProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: FloatingPlacement;
  ariaLabel: string;
  role?: 'dialog' | 'menu';
  className?: string;
  modal?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}>;

export function Popover({
  open,
  onOpenChange,
  anchorRef,
  anchorRect,
  placement = 'bottom-start',
  ariaLabel,
  role = 'dialog',
  className = '',
  modal = false,
  autoFocus = false,
  restoreFocus = true,
  onKeyDown,
  children,
}: PopoverProps) {
  const portalHost = useUiPortalHost();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const dismiss = useCallback(() => onOpenChangeRef.current(false), []);
  const resolvedAnchorRef = anchorRef;
  const anchor: FloatingAnchor = anchorRect
    ? { kind: 'rect', rect: anchorRect }
    : { kind: 'element', ref: resolvedAnchorRef! };
  const activeOpen = open && portalHost !== null;
  const { position } = useFloatingPosition({
    open: activeOpen,
    anchor,
    surfaceRef,
    placement,
    gap: OVERLAY_GAP,
    viewportMargin: VIEWPORT_MARGIN,
  });
  const overlay = useOverlayLifecycle({
    open: activeOpen,
    surfaceRef,
    anchorRef: anchorRect ? undefined : resolvedAnchorRef,
    onDismiss: dismiss,
    modal,
    autoFocus,
    escape: true,
    outsidePress: true,
    restoreFocus,
    lockScroll: modal,
  });

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const local = portalHost
      ? viewportPointToPortalHost(portalHost, { x: position.x, y: position.y })
      : { x: position.x, y: position.y };
    surface.style.setProperty('--oxs-popover-x', `${local.x}px`);
    surface.style.setProperty('--oxs-popover-y', `${local.y}px`);
    surface.style.setProperty('--oxs-overlay-depth', String(overlay.depth));
  }, [overlay.depth, portalHost, position.x, position.y]);

  if (!activeOpen || !portalHost) return null;

  return createPortal(
    <Surface
      ref={surfaceRef}
      className={`ui-popover ${className}`.trim()}
      material="glass"
      elevation={3}
      radius="md"
      role={role}
      aria-label={ariaLabel}
      aria-modal={modal || undefined}
      tabIndex={modal ? -1 : undefined}
      data-placement={position.placement}
      data-ready={position.ready}
      data-oxs-overlay-depth={overlay.depth}
      onKeyDown={onKeyDown}
    >
      {children}
    </Surface>,
    portalHost,
  );
}

export type MenuProps = PropsWithChildren<OverlayAnchorProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: FloatingPlacement;
  ariaLabel: string;
  className?: string;
  focusReturnRef?: RefObject<HTMLElement | null>;
}>;

export function Menu({
  open,
  onOpenChange,
  anchorRef,
  anchorRect,
  placement = 'bottom-start',
  ariaLabel,
  className = '',
  focusReturnRef,
  children,
}: MenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef(new TypeaheadController());
  const tabExitRef = useRef<'forward' | 'backward' | null>(null);

  const attachMenuRef = useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node;
      if (!node || !open) return;
      queueMicrotask(() => {
        if (menuRef.current !== node || !node.isConnected) return;
        node
          .querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
          ?.focus({ preventScroll: true });
      });
    },
    [open],
  );


  const moveFocus = useRovingFocus({
    containerRef: menuRef,
    itemSelector: '[role="menuitem"]:not([disabled])',
    orientation: 'vertical',
    loop: true,
  });

  const requestOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }
      const returnTarget = focusReturnRef?.current ?? anchorRef?.current ?? null;
      const tabExit = tabExitRef.current;
      tabExitRef.current = null;
      onOpenChange(false);
      queueMicrotask(() => {
        if (!returnTarget?.isConnected) return;
        if (tabExit) {
          if (!focusRelativeTo(returnTarget, tabExit === 'backward')) {
            returnTarget.focus({ preventScroll: true });
          }
        } else if (!returnTarget.closest('[inert]')) {
          returnTarget.focus({ preventScroll: true });
        }
      });
    },
    [anchorRef, focusReturnRef, onOpenChange],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        tabExitRef.current = event.shiftKey ? 'backward' : 'forward';
        requestOpenChange(false);
        return;
      }
      if (isTypeaheadKey(event)) {
        event.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]:not([disabled])',
        ) ?? [])];
        const active = menuRef.current?.ownerDocument.activeElement ?? null;
        const activeIndex = active ? items.indexOf(active as HTMLButtonElement) : -1;
        const match = typeaheadRef.current.search({
          key: event.key,
          labels: items.map((item) => item.textContent ?? ''),
          currentIndex: activeIndex,
          nowMs: event.timeStamp,
          preferNextMatch: true,
        });
        if (match) items[match.index]?.focus({ preventScroll: true });
        return;
      }
      moveFocus(event);
    },
    [moveFocus, requestOpenChange],
  );

  const handleItemClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      const target = event.target as { closest?: (selector: string) => Element | null } | null;
      const item = target?.closest?.('[role="menuitem"]') ?? null;
      if (
        !item ||
        !event.currentTarget.contains(item) ||
        item.hasAttribute('disabled') ||
        item.getAttribute('aria-disabled') === 'true'
      ) return;
      requestOpenChange(false);
    },
    [requestOpenChange],
  );

  const anchorProps: OverlayAnchorProps = anchorRect
    ? { anchorRect }
    : { anchorRef: anchorRef! };

  return (
    <Popover
      {...anchorProps}
      open={open}
      onOpenChange={requestOpenChange}
      placement={placement}
      ariaLabel={ariaLabel}
      role="menu"
      restoreFocus={false}
      className={`ui-menu ${className}`.trim()}
      onKeyDown={handleKeyDown}
    >
      <div ref={attachMenuRef} className="ui-menu__items" onClick={handleItemClick}>
        {children}
      </div>
    </Popover>
  );
}

export type MenuItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'role' | 'type'> & {
  onSelect?: () => void;
  destructive?: boolean;
};

export function MenuItem({
  className = '',
  destructive = false,
  onClick,
  onSelect,
  children,
  ...props
}: PropsWithChildren<MenuItemProps>) {
  return (
    <button
      {...props}
      type="button"
      role="menuitem"
      className={`ui-menu-item ${className}`.trim()}
      data-oxs-cursor-role={props.disabled ? 'not-allowed' : 'pointer'}
      data-destructive={destructive || undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelect?.();
      }}
    >
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <hr className="ui-menu-separator" />;
}

export type ContextMenuAction = {
  id: string;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
};

type ContextMenuTriggerProps = {
  onContextMenu?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  /** Shared press-kernel long-press contract implemented by OntologyX controls such as Button. */
  onLongPress?: (activation: PressActivation) => void;
  longPressDelay?: number;
};

export type ContextMenuProps = {
  ariaLabel: string;
  actions: readonly ContextMenuAction[];
  children: ReactElement<ContextMenuTriggerProps>;
  disabled?: boolean;
  longPressDelayMs?: number;
};

export function ContextMenu({
  ariaLabel,
  actions,
  children,
  disabled = false,
  longPressDelayMs = CONTEXT_LONG_PRESS_DELAY,
}: ContextMenuProps) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const openAt = useCallback((next: { x: number; y: number }) => {
    if (!disabled) setPoint(next);
  }, [disabled]);
  const trigger = cloneElement(children, {
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      children.props.onContextMenu?.(event);
      triggerRef.current = event.currentTarget;
      if (event.defaultPrevented || disabled) return;
      event.preventDefault();
      openAt({ x: event.clientX, y: event.clientY });
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      children.props.onKeyDown?.(event);
      triggerRef.current = event.currentTarget;
      if (
        event.defaultPrevented ||
        disabled ||
        (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10'))
      ) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      openAt({
        x: rect.left + Math.min(24, rect.width / 2),
        y: rect.top + Math.min(24, rect.height / 2),
      });
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      children.props.onPointerDown?.(event);
      triggerRef.current = event.currentTarget;
    },
    onLongPress: (activation: PressActivation) => {
      children.props.onLongPress?.(activation);
      if (disabled || activation.clientX === undefined || activation.clientY === undefined) return;
      openAt({ x: activation.clientX, y: activation.clientY });
    },
    longPressDelay: longPressDelayMs,
  });

  const anchorRect: FloatingGeometryRect = point
    ? { top: point.y, right: point.x, bottom: point.y, left: point.x, width: 0, height: 0 }
    : { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };

  return (
    <>
      {trigger}
      <Menu
        open={point !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPoint(null);
        }}
        anchorRect={anchorRect}
        placement="bottom-start"
        ariaLabel={ariaLabel}
        focusReturnRef={triggerRef}
        className="ui-context-menu"
      >
        {actions.map((action) => (
          <Fragment key={action.id}>
            {action.separatorBefore ? <MenuSeparator /> : null}
            <MenuItem
              disabled={action.disabled}
              destructive={action.destructive}
              onSelect={() => {
                action.onSelect();
              }}
            >
              {action.label}
            </MenuItem>
          </Fragment>
        ))}
      </Menu>
    </>
  );
}

export type SheetPlacement = 'bottom' | 'center' | 'auto';
type SheetName =
  | { ariaLabel: string; ariaLabelledBy?: string }
  | { ariaLabel?: undefined; ariaLabelledBy: string };
type SheetBaseProps = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition?: InteractiveTransitionController;
  placement?: SheetPlacement;
  modal?: boolean;
  ariaDescribedBy?: string;
  panelClassName?: string;
  layerClassName?: string;
  scrimClassName?: string;
  grabber?: boolean;
  grabberProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  dismissLabel?: string;
  grabberLabel?: string;
  restoreFocus?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  autoFocus?: boolean;
}>;
export type SheetProps = SheetName & SheetBaseProps;

export function Sheet({
  open,
  onOpenChange,
  transition,
  placement = 'auto',
  modal = true,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  panelClassName = '',
  layerClassName = '',
  scrimClassName = '',
  grabber = false,
  grabberProps,
  dismissLabel = 'Close overlay',
  grabberLabel = 'Drag sheet',
  restoreFocus = true,
  header,
  footer,
  autoFocus = true,
  children,
}: SheetProps) {
  const internalTransition = useInteractiveTransition({
    initialProgress: open ? 1 : 0,
    spring: placement === 'center' ? 'standard' : 'expressive',
  });
  const controller = transition ?? internalTransition;
  const portalHost = useUiPortalHost();
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const requestClose = useCallback(() => onOpenChangeRef.current(false), []);
  const overlay = useOverlayLifecycle({
    open: open && portalHost !== null,
    surfaceRef: panelRef,
    layerRef,
    onDismiss: requestClose,
    modal,
    autoFocus,
    escape: true,
    outsidePress: false,
    restoreFocus,
    lockScroll: modal,
  });

  useEffect(() => {
    controller.attachElement(panelRef.current);
    controller.animateTo(open ? 1 : 0);
    return controller.subscribe((snapshot) => {
      const layer = layerRef.current;
      if (!layer) return;
      layer.style.setProperty('--oxs-sheet-progress', String(snapshot.progress));
      layer.style.setProperty('--oxs-sheet-offset', `${(1 - snapshot.progress) * 100}%`);
      layer.style.setProperty('--oxs-sheet-scale', String(0.96 + snapshot.progress * 0.04));
      layer.dataset.transitionPhase = snapshot.phase;
      layer.dataset.visible = String(snapshot.progress > 0.001);
    });
  }, [controller, open]);

  useLayoutEffect(() => {
    layerRef.current?.style.setProperty('--oxs-overlay-depth', String(overlay.depth));
  }, [overlay.depth]);

  if (!portalHost) return null;

  return createPortal(
    <div
      ref={layerRef}
      className={['ui-sheet-layer', `ui-sheet-layer--${placement}`, layerClassName].filter(Boolean).join(' ')}
      data-open={open}
      data-visible={open}
      aria-hidden={!open}
      inert={open ? undefined : true}
      data-oxs-overlay-depth={overlay.depth}
    >
      {modal ? (
        <Scrim
          active={open}
          onDismiss={requestClose}
          dismissLabel={dismissLabel}
          className={`ui-sheet-scrim ${scrimClassName}`.trim()}
        />
      ) : null}
      <div className="ui-sheet-host">
        <Surface
          ref={panelRef}
          className={`ui-sheet-panel ${panelClassName}`.trim()}
          material="glass"
          elevation={3}
          radius={placement === 'center' ? 'lg' : 'xl'}
          clip
          role="dialog"
          aria-modal={modal || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          tabIndex={-1}
        >
          <SafeArea className="ui-sheet-safe-area">
            {grabber ? (
              <button
                {...grabberProps}
                type="button"
                className="ui-sheet-grabber"
                aria-label={grabberProps?.['aria-label'] ?? grabberLabel}
                tabIndex={-1}
                data-oxs-cursor-role="ns-resize"
              />
            ) : null}
            {header ? <div className="ui-sheet-header">{header}</div> : null}
            <div className="ui-sheet-content">{children}</div>
            {footer ? <div className="ui-sheet-footer">{footer}</div> : null}
          </SafeArea>
        </Surface>
      </div>
    </div>,
    portalHost,
  );
}

export type BottomSheetProps = SheetName &
  Omit<SheetBaseProps, 'placement' | 'grabber' | 'grabberProps' | 'transition'> & {
    transition?: InteractiveTransitionController;
    draggable?: boolean;
    dragDistance?: number;
  };

export function BottomSheet({
  open,
  onOpenChange,
  transition,
  draggable = true,
  dragDistance = 320,
  ...props
}: BottomSheetProps) {
  const onOpenChangeRef = useRef(onOpenChange);
  const safeDragDistance = Math.max(1, Math.abs(dragDistance));
  const startProgressRef = useRef(open ? 1 : 0);
  onOpenChangeRef.current = onOpenChange;
  const localTransition = useInteractiveTransition({
    initialProgress: open ? 1 : 0,
    spring: 'expressive',
    onRest: transition ? undefined : (target) => onOpenChangeRef.current(target === 1),
  });
  const controller = transition ?? localTransition;
  const pan = usePanGesture({
    axis: 'y',
    disabled: !draggable,
    priority: 'system',
    threshold: 5,
    onBegin: () => {
      startProgressRef.current = controller.snapshot.progress;
      controller.begin();
    },
    onUpdate: (sample) => {
      controller.setInteractiveProgress(
        startProgressRef.current - sample.translation.y / safeDragDistance,
        -sample.velocity.y / safeDragDistance,
      );
    },
    onEnd: () => controller.settle({ threshold: 0.5, velocityThreshold: 0.7 }),
    onCancel: () => controller.animateTo(open ? 1 : 0),
  });

  return (
    <Sheet
      {...props}
      open={open}
      onOpenChange={onOpenChange}
      transition={controller}
      placement="bottom"
      grabber
      grabberProps={pan.gestureProps as ButtonHTMLAttributes<HTMLButtonElement>}
    />
  );
}

function isTypeaheadKey(event: ReactKeyboardEvent<HTMLElement>) {
  return isTypeaheadCharacter(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey;
}

type TooltipTriggerProps = {
  'aria-describedby'?: string;
  onPointerEnter?: PointerEventHandler<HTMLElement>;
  onPointerLeave?: PointerEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onBlur?: FocusEventHandler<HTMLElement>;
};

export type TooltipProps = {
  content: ReactNode;
  children: ReactElement<TooltipTriggerProps>;
  placement?: FloatingPlacement;
  delayMs?: number;
  disabled?: boolean;
};

export function Tooltip({
  content,
  placement = 'top-start',
  delayMs = TOOLTIP_DELAY,
  disabled = false,
  children,
}: TooltipProps) {
  const portalHost = useUiPortalHost();
  const tooltipId = useId();
  const anchorRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const anchor: FloatingAnchor = { kind: 'element', ref: anchorRef };
  const activeOpen = open && portalHost !== null;
  const { position } = useFloatingPosition({
    open: activeOpen,
    anchor,
    surfaceRef: tooltipRef,
    placement,
    gap: 6,
    viewportMargin: VIEWPORT_MARGIN,
  });
  const overlay = useOverlayLifecycle({
    open: activeOpen,
    surfaceRef: tooltipRef,
    anchorRef,
    onDismiss: () => setOpen(false),
    modal: false,
    autoFocus: false,
    escape: true,
    outsidePress: false,
    restoreFocus: false,
    lockScroll: false,
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  useEffect(() => clearTimer, [clearTimer]);
  const scheduleOpen = useCallback(() => {
    if (disabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setOpen(true);
    }, delayMs);
  }, [clearTimer, delayMs, disabled]);
  const close = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer]);

  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;
    const local = portalHost
      ? viewportPointToPortalHost(portalHost, { x: position.x, y: position.y })
      : { x: position.x, y: position.y };
    tooltip.style.setProperty('--oxs-tooltip-x', `${local.x}px`);
    tooltip.style.setProperty('--oxs-tooltip-y', `${local.y}px`);
    tooltip.style.setProperty('--oxs-overlay-depth', String(overlay.depth));
  }, [overlay.depth, portalHost, position.x, position.y]);

  const existingDescription = children.props['aria-describedby'];
  const describedBy = activeOpen ? [existingDescription, tooltipId].filter(Boolean).join(' ') : existingDescription;
  const trigger = cloneElement(children, {
    'aria-describedby': describedBy,
    onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
      children.props.onPointerEnter?.(event);
      anchorRef.current = event.currentTarget;
      if (!event.defaultPrevented && event.pointerType !== 'touch') scheduleOpen();
    },
    onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
      children.props.onPointerLeave?.(event);
      close();
    },
    onFocus: (event: ReactFocusEvent<HTMLElement>) => {
      children.props.onFocus?.(event);
      anchorRef.current = event.currentTarget;
      if (!event.defaultPrevented) scheduleOpen();
    },
    onBlur: (event: ReactFocusEvent<HTMLElement>) => {
      children.props.onBlur?.(event);
      close();
    },
  });

  return (
    <>
      {trigger}
      {activeOpen && portalHost ? createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="ui-tooltip"
          data-placement={position.placement}
          data-ready={position.ready}
          data-oxs-overlay-depth={overlay.depth}
        >
          {content}
        </div>,
        portalHost,
      ) : null}
    </>
  );
}
