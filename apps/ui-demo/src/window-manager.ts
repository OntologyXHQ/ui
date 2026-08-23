export const DEMO_WORKSPACES = [1, 2, 3, 4] as const;
export type DemoWorkspaceId = (typeof DEMO_WORKSPACES)[number];

export type DemoWindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DemoWindowMode = 'normal' | 'maximized';

export type DemoWindowInstance = {
  id: string;
  appId: string;
  workspaceId: DemoWorkspaceId;
  bounds: DemoWindowBounds;
  mode: DemoWindowMode;
  minimized: boolean;
  closing: boolean;
  z: number;
};

export type DemoWindowManagerState = {
  activeWorkspaceId: DemoWorkspaceId;
  focusedWindowId: string | null;
  windows: readonly DemoWindowInstance[];
  nextInstance: number;
  nextZ: number;
};

export type DemoWindowManagerAction =
  | { type: 'open'; appId: string; workspaceId: DemoWorkspaceId; bounds: DemoWindowBounds }
  | { type: 'focus'; id: string }
  | { type: 'move'; id: string; bounds: DemoWindowBounds }
  | { type: 'toggle-maximize'; id: string }
  | { type: 'minimize'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'request-close'; id: string }
  | { type: 'commit-close'; id: string }
  | { type: 'switch-workspace'; workspaceId: DemoWorkspaceId }
  | { type: 'move-to-workspace'; id: string; workspaceId: DemoWorkspaceId }
  | { type: 'cycle-focus'; direction: 1 | -1 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function clampDemoWindowBounds(bounds: DemoWindowBounds): DemoWindowBounds {
  const width = Math.min(0.92, Math.max(0.34, bounds.width));
  const height = Math.min(0.92, Math.max(0.32, bounds.height));
  return {
    width,
    height,
    x: Math.min(1 - width, Math.max(0, clamp01(bounds.x))),
    y: Math.min(1 - height, Math.max(0, clamp01(bounds.y))),
  };
}

function nextCascadeBounds(index: number, appId: string): DemoWindowBounds {
  const width = appId === 'settings' ? 0.72 : appId === 'terminal' ? 0.56 : 0.62;
  const height = appId === 'settings' ? 0.78 : appId === 'terminal' ? 0.56 : 0.7;
  const offset = (index % 5) * 0.035;
  return clampDemoWindowBounds({
    x: 0.1 + offset,
    y: 0.07 + offset,
    width,
    height,
  });
}

export function createInitialDemoWindowManagerState(): DemoWindowManagerState {
  return {
    activeWorkspaceId: 1,
    focusedWindowId: 'editor-2',
    nextInstance: 5,
    nextZ: 5,
    windows: [
      {
        id: 'browser-1',
        appId: 'browser',
        workspaceId: 1,
        bounds: { x: 0.08, y: 0.06, width: 0.64, height: 0.74 },
        mode: 'normal',
        minimized: false,
        closing: false,
        z: 1,
      },
      {
        id: 'editor-2',
        appId: 'editor',
        workspaceId: 1,
        bounds: { x: 0.22, y: 0.16, width: 0.62, height: 0.7 },
        mode: 'normal',
        minimized: false,
        closing: false,
        z: 2,
      },
      {
        id: 'terminal-3',
        appId: 'terminal',
        workspaceId: 2,
        bounds: { x: 0.16, y: 0.12, width: 0.58, height: 0.58 },
        mode: 'normal',
        minimized: false,
        closing: false,
        z: 3,
      },
      {
        id: 'photos-4',
        appId: 'photos',
        workspaceId: 3,
        bounds: { x: 0.18, y: 0.1, width: 0.64, height: 0.7 },
        mode: 'normal',
        minimized: false,
        closing: false,
        z: 4,
      },
    ],
  };
}

function focusWindow(
  state: DemoWindowManagerState,
  id: string,
  restore = false,
): DemoWindowManagerState {
  const target = state.windows.find((window) => window.id === id);
  if (!target || target.closing) return state;
  const nextZ = state.nextZ + 1;
  return {
    ...state,
    activeWorkspaceId: target.workspaceId,
    focusedWindowId: id,
    nextZ,
    windows: state.windows.map((window) =>
      window.id === id
        ? { ...window, z: nextZ, minimized: restore ? false : window.minimized }
        : window,
    ),
  };
}

function topWindowId(
  windows: readonly DemoWindowInstance[],
  workspaceId: DemoWorkspaceId,
): string | null {
  return (
    windows
      .filter((window) => window.workspaceId === workspaceId && !window.minimized && !window.closing)
      .sort((a, b) => b.z - a.z)[0]?.id ?? null
  );
}

export function demoWindowManagerReducer(
  state: DemoWindowManagerState,
  action: DemoWindowManagerAction,
): DemoWindowManagerState {
  switch (action.type) {
    case 'open': {
      const id = `${action.appId}-${state.nextInstance}`;
      const nextZ = state.nextZ + 1;
      return {
        ...state,
        activeWorkspaceId: action.workspaceId,
        focusedWindowId: id,
        nextInstance: state.nextInstance + 1,
        nextZ,
        windows: [
          ...state.windows,
          {
            id,
            appId: action.appId,
            workspaceId: action.workspaceId,
            bounds: clampDemoWindowBounds(action.bounds),
            mode: 'normal',
            minimized: false,
            closing: false,
            z: nextZ,
          },
        ],
      };
    }
    case 'focus':
      return focusWindow(state, action.id);
    case 'restore':
      return focusWindow(state, action.id, true);
    case 'move':
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id && window.mode === 'normal'
            ? { ...window, bounds: clampDemoWindowBounds(action.bounds) }
            : window,
        ),
      };
    case 'toggle-maximize': {
      const target = state.windows.find((window) => window.id === action.id);
      if (!target) return state;
      const focused = focusWindow(state, action.id, true);
      return {
        ...focused,
        windows: focused.windows.map((window) =>
          window.id === action.id
            ? { ...window, mode: window.mode === 'maximized' ? 'normal' : 'maximized' }
            : window,
        ),
      };
    }
    case 'minimize': {
      const windows = state.windows.map((window) =>
        window.id === action.id ? { ...window, minimized: true } : window,
      );
      return {
        ...state,
        windows,
        focusedWindowId:
          state.focusedWindowId === action.id
            ? topWindowId(windows, state.activeWorkspaceId)
            : state.focusedWindowId,
      };
    }
    case 'request-close': {
      const target = state.windows.find((window) => window.id === action.id);
      if (!target) return state;
      if (target.minimized) {
        const windows = state.windows.filter((window) => window.id !== action.id);
        return {
          ...state,
          windows,
          focusedWindowId:
            state.focusedWindowId === action.id
              ? topWindowId(windows, target.workspaceId)
              : state.focusedWindowId,
        };
      }
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id ? { ...window, closing: true } : window,
        ),
      };
    }
    case 'commit-close': {
      const target = state.windows.find((window) => window.id === action.id);
      if (!target) return state;
      const windows = state.windows.filter((window) => window.id !== action.id);
      return {
        ...state,
        windows,
        focusedWindowId:
          state.focusedWindowId === action.id
            ? topWindowId(windows, target.workspaceId)
            : state.focusedWindowId,
      };
    }
    case 'switch-workspace': {
      const focusedWindowId = topWindowId(state.windows, action.workspaceId);
      return { ...state, activeWorkspaceId: action.workspaceId, focusedWindowId };
    }
    case 'move-to-workspace': {
      const moved = state.windows.map((window) =>
        window.id === action.id ? { ...window, workspaceId: action.workspaceId } : window,
      );
      return {
        ...state,
        windows: moved,
        focusedWindowId:
          state.focusedWindowId === action.id
            ? topWindowId(moved, state.activeWorkspaceId)
            : state.focusedWindowId,
      };
    }
    case 'cycle-focus': {
      const candidates = state.windows
        .filter(
          (window) =>
            window.workspaceId === state.activeWorkspaceId && !window.minimized && !window.closing,
        )
        .sort((a, b) => b.z - a.z);
      if (candidates.length < 2) return state;
      const currentIndex = Math.max(
        0,
        candidates.findIndex((window) => window.id === state.focusedWindowId),
      );
      const nextIndex =
        (currentIndex + action.direction + candidates.length) % candidates.length;
      return focusWindow(state, candidates[nextIndex].id);
    }
    default:
      return state;
  }
}

export function demoDefaultBoundsFor(
  state: DemoWindowManagerState,
  workspaceId: DemoWorkspaceId,
  appId: string,
): DemoWindowBounds {
  const count = state.windows.filter((window) => window.workspaceId === workspaceId).length;
  return nextCascadeBounds(count, appId);
}
