#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'apps/ui-studio/src/catalog/generated/catalog.generated.json').read_text())
MATRIX = json.loads((ROOT / 'apps/ui-studio/src/catalog/generated/fixture-matrix.generated.json').read_text())
issues: list[str] = []

required_guidance = ('accessibility', 'rtl', 'touch', 'responsive')
for entry in CATALOG:
    if entry['layer'] not in {'components', 'system'}:
        continue
    for field in required_guidance:
        if not str(entry.get(field, '')).strip():
            issues.append(f"{entry['exportName']}: missing {field} coverage declaration")
    if entry['status'] == 'deprecated':
        issues.append(f"{entry['exportName']}: deprecated export leaked onto canonical public catalog")

missing_fixture = [item['id'] for item in MATRIX['fixtures'] if item['mode'] == 'missing']
if missing_fixture:
    issues.append(f'public exports without real Studio fixture/example: {missing_fixture}')

studio = ROOT / 'apps/ui-studio/src'
raw_control = re.compile(r'<(?:button|input|select|textarea)(?:\s|>)')
for source in studio.rglob('*.tsx'):
    text = source.read_text()
    if raw_control.search(text):
        issues.append(f'{source.relative_to(ROOT)}: raw reusable control bypasses self-hosted @ontologyx/ui')

for removed in [
    'packages/ui/src/components/AppTile.tsx',
    'packages/ui/src/patterns/ApplicationLauncherPattern.tsx',
    'packages/ui/src/patterns/DesktopWorkspacePattern.tsx',
]:
    if (ROOT / removed).exists():
        issues.append(f'completed compatibility path still present: {removed}')

if (ROOT / 'packages/ui/src/legacy.ts').exists():
    issues.append('completed @ontologyx/ui/legacy compatibility surface still exists')

if issues:
    print('UI platform hardening gate failed:')
    for issue in issues:
        print(f' - {issue}')
    raise SystemExit(1)

for command in [
    ['python3', 'scripts/generate-fixture-matrix.py', '--check'],
    ['python3', 'scripts/check-ui-budgets.py'],
]:
    result = subprocess.run(command, cwd=ROOT, text=True)
    if result.returncode:
        raise SystemExit(result.returncode)

print('UI platform hardening gate passed: coverage · deterministic fixtures · self-hosting · compatibility cleanup · budgets.')
