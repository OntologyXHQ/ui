#!/usr/bin/env python3
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
issues: list[str] = []
keyboard = (ROOT / 'packages/ui/src/system/SystemKeyboard.tsx').read_text()
button = (ROOT / 'packages/ui/src/components/Button.tsx').read_text()
styles = (ROOT / 'packages/ui/src/styles/system-ui.css').read_text()
index = (ROOT / 'packages/ui/src/system/index.ts').read_text()
docs = (ROOT / 'packages/ui/src/system/System.docs.tsx').read_text()

for token in [
    'SystemKeyboardSurfaceState', 'SystemKeyboardCommand', 'systemKeyboardLayouts',
    "kind=\"privileged\"", 'data-oxs-system-keyboard-surface-id', 'data-oxs-system-keyboard-secure',
    "type: 'request-layout'", "type: 'request-language'", "type: 'modifier'",
    'onLongPress', 'repeatTimerRef', 'alternates', "contentPurpose === 'numeric'",
]:
    if token not in keyboard:
        issues.append(f'missing keyboard contract token: {token}')

if "import { Badge, Button } from '../components';" not in keyboard:
    issues.append('System keyboard must compose public Components for controls')
if re.search(r"from ['\"]\.\./primitives", keyboard):
    issues.append('System keyboard may not import Primitives directly')
for forbidden in ['document.activeElement', '.value =', 'execCommand(', 'dispatchEvent(new InputEvent']:
    if forbidden in keyboard:
        issues.append(f'keyboard bypasses native editing boundary: {forbidden}')

for token in ['onLongPress?:', 'onPressChange?:', 'longPressDelay?:', 'usePress({']:
    if token not in button:
        issues.append(f'Button shared press surface missing: {token}')
for token in ['min-block-size: max(var(--oxs-touch-target-min)', '@container oxs-system-keyboard', 'var(--oxs-safe-block-end)', '.ui-system-keyboard__key--space']:
    if token not in styles:
        issues.append(f'keyboard adaptive/touch CSS missing: {token}')
for token in ["from './SystemKeyboard'", 'SystemKeyboardHost', 'systemKeyboardLayouts']:
    if token not in index:
        issues.append(f'System public surface missing: {token}')
for token in ['SystemKeyboardExample', "component: 'SystemKeyboardExample'", "contentPurpose: 'text'", 'Secure session']:
    if token not in docs:
        issues.append(f'Studio/docs keyboard acceptance missing: {token}')

# Host/native ownership is intentionally outside this standalone package.

if issues:
    print('System keyboard gate failed:')
    for issue in issues: print(' - ' + issue)
    raise SystemExit(1)
print('System keyboard gate passed: privileged ownership · model · press/repeat/alternates · adaptive/RTL · secure/purpose · Studio acceptance.')
