import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PrimitiveSvgProps } from './PrimitiveProps';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconMirror = 'auto' | 'always' | 'never';
export type IconTransitionMotion = 'replace' | 'pulse' | 'rotate';

export type UiIconGlyphDefinition = Readonly<{
  paths: readonly string[];
}>;

export type UiIconTransitionDefinition<State extends string = string> = Readonly<{
  from: State;
  to: State;
  transientState: string;
  transient?: UiIconGlyphDefinition;
  motion: IconTransitionMotion;
}>;

export type UiIconDefinition<State extends string = string> = Readonly<{
  viewBox: string;
  mirrorInRtl: boolean;
  defaultState: State;
  states: Readonly<Record<State, UiIconGlyphDefinition>>;
  transitions: readonly UiIconTransitionDefinition<State>[];
}>;

type UiIconGlyphObject = Readonly<{ paths: readonly string[] }>;
type UiIconGlyphInput = readonly string[] | UiIconGlyphObject;

function isUiIconGlyphObject(input: UiIconGlyphInput): input is UiIconGlyphObject {
  return !Array.isArray(input);
}

type UiStaticIconDefinitionInput = Readonly<{
  paths: readonly string[];
  viewBox?: string;
  mirrorInRtl?: boolean;
  states?: never;
  defaultState?: never;
  transitions?: never;
}>;

type UiIconTransitionInput<State extends string> = Readonly<{
  from: State;
  to: State;
  /** Explicit transient/transition state name published while the visual is between stable states. */
  transientState: string;
  /** Optional transient glyph rendered between the source and destination stable glyphs. */
  transient?: UiIconGlyphInput;
  /** Finite motion treatment; semantic state never depends on the animation completing. @default replace */
  motion?: IconTransitionMotion;
}>;

type UiStatefulIconDefinitionInput<State extends string> = Readonly<{
  defaultState: State;
  states: Readonly<Record<State, UiIconGlyphInput>>;
  transitions?: readonly UiIconTransitionInput<State>[];
  viewBox?: string;
  mirrorInRtl?: boolean;
  paths?: never;
}>;

function normalizeGlyph(input: UiIconGlyphInput, context: string): UiIconGlyphDefinition {
  const paths: readonly string[] = isUiIconGlyphObject(input) ? input.paths : input;
  if (!paths.length || paths.some((path) => typeof path !== 'string' || !path.trim())) {
    throw new Error(`${context} requires at least one non-empty SVG path.`);
  }
  return Object.freeze({ paths: Object.freeze([...paths]) });
}

export function defineUiIcon(definition: UiStaticIconDefinitionInput): UiIconDefinition<'default'>;
export function defineUiIcon<const State extends string>(
  definition: UiStatefulIconDefinitionInput<State>,
): UiIconDefinition<State>;
export function defineUiIcon(
  definition: UiStaticIconDefinitionInput | UiStatefulIconDefinitionInput<string>,
): UiIconDefinition<string> {
  if ('paths' in definition && definition.paths) {
    return Object.freeze({
      viewBox: definition.viewBox ?? '0 0 24 24',
      mirrorInRtl: definition.mirrorInRtl ?? false,
      defaultState: 'default',
      states: Object.freeze({ default: normalizeGlyph(definition.paths, 'defineUiIcon') }),
      transitions: Object.freeze([]),
    });
  }

  const stateNames = Object.keys(definition.states);
  if (!stateNames.length) throw new Error('defineUiIcon stateful definitions require stable states.');
  if (!stateNames.includes(definition.defaultState)) {
    throw new Error(`defineUiIcon defaultState ${JSON.stringify(definition.defaultState)} is not a declared stable state.`);
  }

  const states: Record<string, UiIconGlyphDefinition> = {};
  for (const state of stateNames) {
    states[state] = normalizeGlyph(definition.states[state], `defineUiIcon state ${JSON.stringify(state)}`);
  }

  const keys = new Set<string>();
  const transitions = (definition.transitions ?? []).map((transition) => {
    if (!states[transition.from] || !states[transition.to]) {
      throw new Error(`defineUiIcon transition ${transition.from} -> ${transition.to} references an unknown stable state.`);
    }
    if (transition.from === transition.to) {
      throw new Error('defineUiIcon transitions must move between distinct stable states.');
    }
    const transientState = transition.transientState.trim();
    if (!transientState) throw new Error('defineUiIcon transitions require a non-empty transientState.');
    if (states[transientState]) {
      throw new Error(`defineUiIcon transientState ${JSON.stringify(transientState)} must be distinct from stable states.`);
    }
    const key = `${transition.from}\u0000${transition.to}`;
    if (keys.has(key)) throw new Error(`defineUiIcon transition ${transition.from} -> ${transition.to} is duplicated.`);
    keys.add(key);
    return Object.freeze({
      from: transition.from,
      to: transition.to,
      transientState,
      transient: transition.transient
        ? normalizeGlyph(transition.transient, `defineUiIcon transient state ${JSON.stringify(transientState)}`)
        : undefined,
      motion: transition.motion ?? 'replace',
    });
  });

  return Object.freeze({
    viewBox: definition.viewBox ?? '0 0 24 24',
    mirrorInRtl: definition.mirrorInRtl ?? false,
    defaultState: definition.defaultState,
    states: Object.freeze(states),
    transitions: Object.freeze(transitions),
  });
}

const ICONS = {
  apps: defineUiIcon({ paths: ['M5 5h5v5H5zm9 0h5v5h-5zM5 14h5v5H5zm9 0h5v5h-5z'] }),
  browser: defineUiIcon({ paths: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M4 12h16', 'M12 4c3 3.5 3 12.5 0 16', 'M12 4c-3 3.5-3 12.5 0 16'] }),
  'chevron-end': defineUiIcon({ paths: ['m9 6 6 6-6 6'], mirrorInRtl: true }),
  'chevron-start': defineUiIcon({ paths: ['m15 6-6 6 6 6'], mirrorInRtl: true }),
  check: defineUiIcon({ paths: ['m5 12.5 4.2 4.2L19 7'] }),
  close: defineUiIcon({ paths: ['m7 7 10 10M17 7 7 17'] }),
  editor: defineUiIcon({ paths: ['m9 6-4 6 4 6M15 6l4 6-4 6M13.5 5 10.5 19'] }),
  files: defineUiIcon({ paths: ['M4 7.5h6l1.6 2H20v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16'] }),
  music: defineUiIcon({ paths: ['M9 18V7l9-2v11M9 18a2.5 2.5 0 1 1-2.5-2.5H9zm9-2a2.5 2.5 0 1 1-2.5-2.5H18'] }),
  photos: defineUiIcon({ paths: ['M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'M7.5 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z', 'm6.5 17 4-4 2.6 2.6 1.8-1.8 2.6 3.2'] }),
  playback: defineUiIcon({
    defaultState: 'play',
    states: {
      play: ['M8 5.5v13l10-6.5z'],
      pause: ['M8 6h3v12H8zm5 0h3v12h-3z'],
    },
    transitions: [
      {
        from: 'play',
        to: 'pause',
        transientState: 'pausing',
        transient: ['M8.5 6v12l3.1-2V8zm5 0H16v12h-2.5z'],
        motion: 'pulse',
      },
      {
        from: 'pause',
        to: 'play',
        transientState: 'playing',
        transient: ['M8.5 6v12l3.1-2V8zm5 0H16v12h-2.5z'],
        motion: 'pulse',
      },
    ],
  }),
  search: defineUiIcon({ paths: ['m17.5 17.5-3.4-3.4', 'M15.5 10.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z'] }),
  settings: defineUiIcon({ paths: ['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z', 'M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18'] }),
  software: defineUiIcon({ paths: ['m12 3 8 4.5v9L12 21l-8-4.5v-9zm0 0v9m8-4.5-8 4.5-8-4.5M12 12v9'] }),
  terminal: defineUiIcon({ paths: ['m5 7 4 4-4 4M11 16h7'] }),
} as const;

export type IconName = keyof typeof ICONS;
export type IconStateFor<Name extends IconName> = keyof (typeof ICONS)[Name]['states'] & string;

type IconSvgProps = Omit<
  PrimitiveSvgProps,
  | 'role'
  | 'aria-label'
  | 'aria-hidden'
  | 'focusable'
  | 'onAnimationStart'
  | 'onAnimationEnd'
>;

type IconOwnedSvgProp =
  | 'role'
  | 'aria-label'
  | 'aria-hidden'
  | 'focusable'
  | 'onAnimationStart'
  | 'onAnimationEnd';

type IconReservedSvgProps = {
  [Prop in IconOwnedSvgProp]?: never;
};

type IconSharedProps = IconSvgProps & IconReservedSvgProps & {
  /** Token-compatible rendered size. @default md */
  size?: IconSize;
  /** Gives a standalone icon image semantics; omit for a decorative aria-hidden icon. */
  label?: string;
  /** Controls semantic RTL mirroring without exposing physical left/right variants. @default auto */
  mirror?: IconMirror;
};

export type IconProps<
  Name extends IconName = IconName,
  State extends string = string,
> = IconSharedProps &
  (
    | {
        /** Uses a built-in semantic glyph family. */
        name: Name;
        glyph?: never;
        /** Stable semantic state requested from the built-in family. Defaults to that family's defaultState. */
        state?: IconStateFor<Name>;
      }
    | {
        /** Omit `name` when supplying a custom glyph family; built-in name and custom glyph are mutually exclusive. */
        name?: never;
        /** Uses a custom immutable glyph/state family created by defineUiIcon. */
        glyph: UiIconDefinition<State>;
        /** Stable semantic state requested from the custom family. Defaults to that family's defaultState. */
        state?: State;
      }
  );

type ActiveIconTransition = {
  from: string;
  to: string;
  transientState: string;
  transient?: UiIconGlyphDefinition;
  motion: IconTransitionMotion;
  sequence: number;
};

type IconVisualState = {
  definition: UiIconDefinition<string>;
  stableState: string;
  transition: ActiveIconTransition | null;
  sequence: number;
};

function iconPaths(glyph: UiIconGlyphDefinition): ReactNode {
  return glyph.paths.map((path, index) => (
    <path key={`${index}:${path}`} d={path} vectorEffect="non-scaling-stroke" />
  ));
}

function transitionFor(definition: UiIconDefinition<string>, from: string, to: string) {
  return definition.transitions.find((transition) => transition.from === from && transition.to === to);
}

function assertIconState(definition: UiIconDefinition<string>, state: string) {
  if (!definition.states[state]) {
    throw new Error(`Icon state ${JSON.stringify(state)} is not declared by this glyph family.`);
  }
}

const ICON_TRANSITION_FALLBACK_MS = 240;
const ICON_TRANSITION_SETTLE_SLACK_MS = 34;

function readIconTransitionBudgetMs(element: Element) {
  const realmWindow = element.ownerDocument.defaultView;
  if (!realmWindow) return ICON_TRANSITION_FALLBACK_MS;

  const style = realmWindow.getComputedStyle(element);
  const durations = parseCssTimeList(style.animationDuration);
  const delays = parseCssTimeList(style.animationDelay);
  const count = Math.max(durations.length, delays.length);
  let longest = 0;

  for (let index = 0; index < count; index += 1) {
    const duration = durations[index % Math.max(1, durations.length)] ?? 0;
    const delay = delays[index % Math.max(1, delays.length)] ?? 0;
    longest = Math.max(longest, Math.max(0, duration + delay));
  }

  return (longest > 0 ? longest : ICON_TRANSITION_FALLBACK_MS)
    + ICON_TRANSITION_SETTLE_SLACK_MS;
}

function parseCssTimeList(value: string) {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      if (token.endsWith('ms')) return Number.parseFloat(token);
      if (token.endsWith('s')) return Number.parseFloat(token) * 1000;
      return 0;
    })
    .map((milliseconds) => (Number.isFinite(milliseconds) ? milliseconds : 0));
}

export function Icon<Name extends IconName = IconName, State extends string = string>({
  name,
  glyph: customGlyph,
  size = 'md',
  label,
  state,
  mirror = 'auto',
  className = '',
  ...props
}: IconProps<Name, State>) {
  const definition = (customGlyph ?? ICONS[name as IconName]) as UiIconDefinition<string>;
  const desiredState = state ?? definition.defaultState;
  assertIconState(definition, desiredState);

  const [visual, setVisual] = useState<IconVisualState>(() => ({
    definition,
    stableState: desiredState,
    transition: null,
    sequence: 0,
  }));
  const transitionNodeRef = useRef<SVGGElement>(null);

  useLayoutEffect(() => {
    setVisual((previous) => {
      if (previous.definition !== definition) {
        return { definition, stableState: desiredState, transition: null, sequence: previous.sequence + 1 };
      }
      const currentDestination = previous.transition?.to ?? previous.stableState;
      if (currentDestination === desiredState) return previous;
      const transition = transitionFor(definition, currentDestination, desiredState);
      if (!transition) {
        return {
          definition,
          stableState: desiredState,
          transition: null,
          sequence: previous.sequence + 1,
        };
      }
      return {
        definition,
        stableState: currentDestination,
        transition: {
          ...transition,
          sequence: previous.sequence + 1,
        },
        sequence: previous.sequence + 1,
      };
    });
  }, [definition, desiredState]);

  const activeVisual = visual.definition === definition
    ? visual
    : { definition, stableState: desiredState, transition: null, sequence: visual.sequence };
  const activeTransition = activeVisual.transition;
  const shouldMirror = mirror === 'always' || (mirror === 'auto' && definition.mirrorInRtl);

  const settleTransition = useCallback((sequence: number) => {
    setVisual((previous) => {
      if (!previous.transition || previous.transition.sequence !== sequence) return previous;
      return {
        definition: previous.definition,
        stableState: previous.transition.to,
        transition: null,
        sequence: previous.sequence,
      };
    });
  }, []);

  useEffect(() => {
    if (!activeTransition) return;

    const node = transitionNodeRef.current;
    const realmWindow = node?.ownerDocument.defaultView;
    if (!node || !realmWindow) return;

    const sequence = activeTransition.sequence;
    const settleFromBoundary = (event: Event) => {
      if (event.target === node) settleTransition(sequence);
    };
    node.addEventListener('animationend', settleFromBoundary);
    node.addEventListener('animationcancel', settleFromBoundary);

    const timeoutId = realmWindow.setTimeout(
      () => settleTransition(sequence),
      readIconTransitionBudgetMs(node),
    );

    return () => {
      node.removeEventListener('animationend', settleFromBoundary);
      node.removeEventListener('animationcancel', settleFromBoundary);
      realmWindow.clearTimeout(timeoutId);
    };
  }, [activeTransition?.sequence, settleTransition]);

  const semanticState = activeTransition?.to ?? activeVisual.stableState;
  const visualState = activeTransition?.transientState ?? activeVisual.stableState;

  return (
    <svg
      {...props}
      className={[
        'ui-icon',
        `ui-icon--${size}`,
        shouldMirror ? 'ui-icon--mirror-rtl' : '',
        mirror === 'always' ? 'ui-icon--mirror-always' : '',
        className,
      ].filter(Boolean).join(' ')}
      viewBox={definition.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-oxs-icon-state={semanticState}
      data-oxs-icon-visual-state={visualState}
      data-oxs-icon-phase={activeTransition ? 'transitioning' : 'stable'}
      data-oxs-icon-from={activeTransition?.from}
      data-oxs-icon-to={activeTransition?.to}
    >
      {activeTransition ? (
        <g
          key={activeTransition.sequence}
          ref={transitionNodeRef}
          className={`ui-icon__transition ui-icon__transition--${activeTransition.motion}`}
          data-oxs-icon-transient={activeTransition.transientState}
        >
          <g className="ui-icon__layer ui-icon__layer--from">
            {iconPaths(definition.states[activeTransition.from])}
          </g>
          {activeTransition.transient ? (
            <g className="ui-icon__layer ui-icon__layer--transient">
              {iconPaths(activeTransition.transient)}
            </g>
          ) : null}
          <g className="ui-icon__layer ui-icon__layer--to">
            {iconPaths(definition.states[activeTransition.to])}
          </g>
        </g>
      ) : (
        <g className="ui-icon__layer ui-icon__layer--stable" data-oxs-icon-stable={activeVisual.stableState}>
          {iconPaths(definition.states[activeVisual.stableState])}
        </g>
      )}
    </svg>
  );
}
