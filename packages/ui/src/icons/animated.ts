import { defineUiIcon } from '../primitives/Icon';

export const PlaybackGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'play',
  states: {
    play: ['M8 5v14l11-7z'],
    pause: ['M8 5h3v14H8zM14 5h3v14h-3z'],
  },
  transitions: [
    { from: 'play', to: 'pause', transientState: 'pausing', transient: ['M8.5 6v12l3.2-2V8zm5 0H16v12h-2.5z'], motion: 'pulse' },
    { from: 'pause', to: 'play', transientState: 'playing', transient: ['M8.5 6v12l3.2-2V8zm5 0H16v12h-2.5z'], motion: 'pulse' },
  ],
});

export const VolumeStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'high',
  states: {
    muted: ['M4 10h4l5-4v12l-5-4H4z', 'M16 10l5 5M21 10l-5 5'],
    low: ['M4 10h4l5-4v12l-5-4H4z', 'M16 9a4 4 0 0 1 0 6'],
    high: ['M4 10h4l5-4v12l-5-4H4z', 'M16 8a5 5 0 0 1 0 8', 'M18.5 5.5a9 9 0 0 1 0 13'],
  },
  transitions: [
    { from: 'muted', to: 'high', transientState: 'unmuting', transient: ['M4 10h4l5-4v12l-5-4H4z', 'M16 10a3 3 0 0 1 0 4'], motion: 'pulse' },
    { from: 'high', to: 'muted', transientState: 'muting', transient: ['M4 10h4l5-4v12l-5-4H4z', 'M17 10l3 4'], motion: 'pulse' },
    { from: 'low', to: 'high', transientState: 'raising', transient: ['M4 10h4l5-4v12l-5-4H4z', 'M16 8.5a4.5 4.5 0 0 1 0 7'], motion: 'pulse' },
    { from: 'high', to: 'low', transientState: 'lowering', transient: ['M4 10h4l5-4v12l-5-4H4z', 'M16 9a4 4 0 0 1 0 6'], motion: 'pulse' },
  ],
});

export const FavoriteStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'off',
  states: {
    off: ['M12 20S4 15 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-6 11-6 11Z'],
    on: ['M12 20S4 15 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-6 11-6 11Z', 'M7 10c1 3 3 5 5 7 2-2 4-4 5-7'],
  },
  transitions: [
    { from: 'off', to: 'on', transientState: 'favoriting', transient: ['M12 20S4 15 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-6 11-6 11Z', 'M12 5v2M5 12H3M21 12h-2'], motion: 'pulse' },
    { from: 'on', to: 'off', transientState: 'unfavoriting', transient: ['M12 20S4 15 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-6 11-6 11Z'], motion: 'replace' },
  ],
});

export const BookmarkStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'off',
  states: {
    off: ['M7 4h10v16l-5-3-5 3z'],
    on: ['M7 4h10v16l-5-3-5 3z', 'M9 8h6v6l-3-2-3 2z'],
  },
  transitions: [
    { from: 'off', to: 'on', transientState: 'saving', transient: ['M7 4h10v16l-5-3-5 3z', 'M12 7v7M9 10h6'], motion: 'pulse' },
    { from: 'on', to: 'off', transientState: 'removing', transient: ['M7 4h10v16l-5-3-5 3z', 'M9 10h6'], motion: 'replace' },
  ],
});

export const NotificationStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'on',
  states: {
    off: ['M4 4l16 16', 'M7 15l-1 2h11', 'M8 10a4 4 0 0 1 6.5-3', 'M16 11v3l2 3', 'M10 20h4'],
    on: ['M6 17h12l-2-3v-3a4 4 0 0 0-8 0v3z', 'M10 20h4'],
  },
  transitions: [
    { from: 'off', to: 'on', transientState: 'enabling', transient: ['M6 17h12l-2-3v-3a4 4 0 0 0-8 0v3z', 'M12 5V3'], motion: 'pulse' },
    { from: 'on', to: 'off', transientState: 'silencing', transient: ['M6 17h12l-2-3v-3a4 4 0 0 0-8 0v3z', 'M6 6l12 12'], motion: 'replace' },
  ],
});

export const VisibilityStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'visible',
  states: {
    hidden: ['M4 4l16 16', 'M6.5 7.5C4.3 9 3 12 3 12s3.5 6 9 6c1.5 0 2.8-.4 4-1', 'M10 6.2A9 9 0 0 1 12 6c5.5 0 9 6 9 6a13 13 0 0 1-2 3'],
    visible: ['M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  },
  transitions: [
    { from: 'hidden', to: 'visible', transientState: 'revealing', transient: ['M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z'], motion: 'pulse' },
    { from: 'visible', to: 'hidden', transientState: 'hiding', transient: ['M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z', 'M7 7l10 10'], motion: 'replace' },
  ],
});

export const LockStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'locked',
  states: {
    locked: ['M6 10h12v10H6z', 'M8 10V7a4 4 0 0 1 8 0v3'],
    unlocked: ['M6 10h12v10H6z', 'M16 10V7a4 4 0 0 0-7-2.5'],
  },
  transitions: [
    { from: 'locked', to: 'unlocked', transientState: 'unlocking', transient: ['M6 10h12v10H6z', 'M15 10V7a3 3 0 0 0-5-2'], motion: 'pulse' },
    { from: 'unlocked', to: 'locked', transientState: 'locking', transient: ['M6 10h12v10H6z', 'M9 10V7a3 3 0 0 1 6 0'], motion: 'pulse' },
  ],
});

export const ConnectivityStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'online',
  states: {
    offline: ['M4 4l16 16', 'M5 9a12 12 0 0 1 12.5-2', 'M7 13a8 8 0 0 1 7.5-1', 'M10 17a4 4 0 0 1 4 0'],
    online: ['M3 9a13 13 0 0 1 18 0', 'M6 12a9 9 0 0 1 12 0', 'M9 15a5 5 0 0 1 6 0', 'M12 19h.01'],
  },
  transitions: [
    { from: 'offline', to: 'online', transientState: 'connecting', transient: ['M6 12a9 9 0 0 1 12 0', 'M9 15a5 5 0 0 1 6 0', 'M12 19h.01'], motion: 'pulse' },
    { from: 'online', to: 'offline', transientState: 'disconnecting', transient: ['M6 12a9 9 0 0 1 12 0', 'M6 6l12 12'], motion: 'replace' },
  ],
});

export const SyncStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'idle',
  states: {
    idle: ['M19 7v5h-5', 'M5 17v-5h5', 'M18 12a6 6 0 0 0-10.5-4L5 12', 'M6 12a6 6 0 0 0 10.5 4L19 12'],
    synced: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'm8 12 2.5 2.5 5.5-6'],
  },
  transitions: [
    { from: 'idle', to: 'synced', transientState: 'syncing', transient: ['M19 7v5h-5', 'M5 17v-5h5', 'M18 12a6 6 0 0 0-10.5-4L5 12'], motion: 'rotate' },
    { from: 'synced', to: 'idle', transientState: 'refreshing', transient: ['M19 7v5h-5', 'M5 17v-5h5'], motion: 'rotate' },
  ],
});

export const DownloadStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'idle',
  states: {
    idle: ['M12 4v11', 'm-5-5 5 5 5-5', 'M5 20h14'],
    complete: ['M5 20h14', 'm7-12 3 3 5-6'],
  },
  transitions: [
    { from: 'idle', to: 'complete', transientState: 'downloading', transient: ['M12 4v13', 'm-4-4 4 4 4-4', 'M5 20h14'], motion: 'pulse' },
    { from: 'complete', to: 'idle', transientState: 'resetting', transient: ['M12 6v9', 'M5 20h14'], motion: 'replace' },
  ],
});

export const UploadStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'idle',
  states: {
    idle: ['M12 20V9', 'm-5 5 5-5 5 5', 'M5 4h14'],
    complete: ['M5 4h14', 'm7 12 3 3 5-6'],
  },
  transitions: [
    { from: 'idle', to: 'complete', transientState: 'uploading', transient: ['M12 20V7', 'm-4 4 4-4 4 4', 'M5 4h14'], motion: 'pulse' },
    { from: 'complete', to: 'idle', transientState: 'resetting', transient: ['M12 18V9', 'M5 4h14'], motion: 'replace' },
  ],
});

export const DisclosureGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'collapsed',
  mirrorInRtl: true,
  states: {
    collapsed: ['m9.5 5 7 7-7 7'],
    expanded: ['m5 9.5 7 7 7-7'],
  },
  transitions: [
    { from: 'collapsed', to: 'expanded', transientState: 'expanding', transient: ['m7 7 5 10 5-10'], motion: 'rotate' },
    { from: 'expanded', to: 'collapsed', transientState: 'collapsing', transient: ['m7 17 5-10 5 10'], motion: 'rotate' },
  ],
});

export const WindowSizeGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'normal',
  states: {
    normal: ['M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'],
    compact: ['M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5'],
  },
  transitions: [
    { from: 'normal', to: 'compact', transientState: 'shrinking', transient: ['M7 7h10v10H7z'], motion: 'pulse' },
    { from: 'compact', to: 'normal', transientState: 'growing', transient: ['M6 6h12v12H6z'], motion: 'pulse' },
  ],
});

export const MenuStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'closed',
  states: {
    closed: ['M4 7h16M4 12h16M4 17h16'],
    open: ['M6 6l12 12M18 6 6 18'],
  },
  transitions: [
    { from: 'closed', to: 'open', transientState: 'opening', transient: ['M6 8h12M8 16l8-8'], motion: 'rotate' },
    { from: 'open', to: 'closed', transientState: 'closing', transient: ['M6 8h12M8 16h8'], motion: 'rotate' },
  ],
});

export const MicrophoneStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'live',
  states: {
    muted: ['M4 4l16 16', 'M9 9v3a3 3 0 0 0 4.5 2.6', 'M15 11V5a3 3 0 0 0-5.6-1.5', 'M5 11a7 7 0 0 0 11 5.8', 'M12 18v3M9 21h6'],
    live: ['M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3M9 21h6'],
  },
  transitions: [
    { from: 'muted', to: 'live', transientState: 'unmuting', transient: ['M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z', 'M12 18v3'], motion: 'pulse' },
    { from: 'live', to: 'muted', transientState: 'muting', transient: ['M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z', 'M7 7l10 10'], motion: 'replace' },
  ],
});

export const ThemeStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'light',
  states: {
    light: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'],
    dark: ['M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z'],
  },
  transitions: [
    { from: 'light', to: 'dark', transientState: 'dimming', transient: ['M12 4a8 8 0 0 0 0 16c3-2 4-5 4-8s-1-6-4-8Z'], motion: 'rotate' },
    { from: 'dark', to: 'light', transientState: 'brightening', transient: ['M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z'], motion: 'rotate' },
  ],
});

export const PowerStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'off',
  states: {
    off: ['M12 3v8', 'M7 6.5a8 8 0 0 0 10 0'],
    on: ['M12 3v8', 'M7 6.5a8 8 0 1 0 10 0', 'M12 12h.01'],
  },
  transitions: [
    { from: 'off', to: 'on', transientState: 'starting', transient: ['M12 3v9', 'M8 7a7 7 0 0 0 8 0'], motion: 'pulse' },
    { from: 'on', to: 'off', transientState: 'stopping', transient: ['M12 3v7', 'M8 7a7 7 0 0 0 8 0'], motion: 'replace' },
  ],
});

export const RecordStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'idle',
  states: {
    idle: ['M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z'],
    recording: ['M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  },
  transitions: [
    { from: 'idle', to: 'recording', transientState: 'arming', transient: ['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'], motion: 'pulse' },
    { from: 'recording', to: 'idle', transientState: 'stopping', transient: ['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'], motion: 'replace' },
  ],
});

export const CheckboxStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'unchecked',
  states: {
    unchecked: ['M5 5h14v14H5z'],
    checked: ['M5 5h14v14H5z', 'm8 12 2.5 2.5 5.5-6'],
  },
  transitions: [
    { from: 'unchecked', to: 'checked', transientState: 'checking', transient: ['M5 5h14v14H5z', 'm8 12 2 2 3-3'], motion: 'pulse' },
    { from: 'checked', to: 'unchecked', transientState: 'unchecking', transient: ['M5 5h14v14H5z'], motion: 'replace' },
  ],
});

export const RadioStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'unselected',
  states: {
    unselected: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z'],
    selected: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  },
  transitions: [
    { from: 'unselected', to: 'selected', transientState: 'selecting', transient: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'], motion: 'pulse' },
    { from: 'selected', to: 'unselected', transientState: 'clearing', transient: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z'], motion: 'replace' },
  ],
});

export const ActivityStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'idle',
  states: {
    idle: ['M3 12h4l2-5 4 10 2-5h6'],
    active: ['M3 12h3l2-4 3 8 3-8 2 4h5'],
  },
  transitions: [
    { from: 'idle', to: 'active', transientState: 'starting', transient: ['M3 12h4l2-5 3 8 3-8 2 5h4'], motion: 'pulse' },
    { from: 'active', to: 'idle', transientState: 'settling', transient: ['M3 12h4l2-5 3 8 3-8 2 5h4'], motion: 'replace' },
  ],
});

export const LocationStateGlyph = /* @__PURE__ */ defineUiIcon({
  defaultState: 'idle',
  states: {
    idle: ['M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z', 'M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    locating: ['M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
  },
  transitions: [
    { from: 'idle', to: 'locating', transientState: 'acquiring', transient: ['M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z', 'M12 9h.01'], motion: 'pulse' },
    { from: 'locating', to: 'idle', transientState: 'releasing', transient: ['M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z'], motion: 'replace' },
  ],
});

export const ANIMATED_ICON_FAMILY_COUNT = 22 as const;
