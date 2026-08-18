import { describe, expect, it } from 'vitest';
import * as PublicUi from '../../index';
import * as AdvancedUi from '../../advanced';

describe('UI package public surfaces', () => {
  it('keeps internal runtime providers off the canonical developer SDK surface', () => {
    expect(PublicUi).not.toHaveProperty('DragDropProvider');
    expect(PublicUi).not.toHaveProperty('MotionRuntimeProvider');
    expect(PublicUi).not.toHaveProperty('EditableTextRuntimeProvider');
    expect(PublicUi).not.toHaveProperty('OverlayRuntimeProvider');
    expect(AdvancedUi).toHaveProperty('DragDropProvider');
    expect(AdvancedUi).toHaveProperty('MotionRuntimeProvider');
  });

  it('keeps removed compatibility aliases off the canonical SDK', () => {
    expect(PublicUi).not.toHaveProperty('ApplicationLauncherPattern');
    expect(PublicUi).not.toHaveProperty('DesktopWorkspacePattern');
    expect(PublicUi).not.toHaveProperty('AppTile');
  });
});
