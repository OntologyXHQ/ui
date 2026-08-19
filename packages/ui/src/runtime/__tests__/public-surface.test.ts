import { describe, expect, it } from 'vitest';
import * as PublicUi from '../../index';
import * as AdvancedUi from '../../advanced';

describe('UI package public surfaces', () => {
  it('keeps internal runtime providers off the canonical developer SDK surface', () => {
    expect(PublicUi).not.toHaveProperty('DragDropProvider');
    expect(PublicUi).not.toHaveProperty('MotionRuntimeProvider');
    expect(PublicUi).not.toHaveProperty('EditableTextRuntimeProvider');
    expect(PublicUi).not.toHaveProperty('OverlayRuntimeProvider');
    expect(PublicUi).not.toHaveProperty('GestureRuntimeProvider');
    expect(PublicUi).not.toHaveProperty('TypeaheadController');
    expect(AdvancedUi).toHaveProperty('DragDropProvider');
    expect(AdvancedUi).toHaveProperty('MotionRuntimeProvider');
    expect(AdvancedUi).toHaveProperty('GestureRuntimeProvider');
    expect(AdvancedUi).toHaveProperty('TypeaheadController');
  });

  it('keeps removed compatibility aliases off the canonical SDK', () => {
    expect(PublicUi).not.toHaveProperty('ApplicationLauncherPattern');
    expect(PublicUi).not.toHaveProperty('DesktopWorkspacePattern');
    expect(PublicUi).not.toHaveProperty('AppTile');
  });
});
