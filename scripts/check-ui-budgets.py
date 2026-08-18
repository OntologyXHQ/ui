#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / 'packages/ui'
SRC = UI / 'src'
BUDGET = json.loads((ROOT / 'docs/architecture/BUDGETS.json').read_text())
PKG = json.loads((UI / 'package.json').read_text())

issues: list[str] = []
prod_ts = [
    p for p in SRC.rglob('*')
    if p.is_file()
    and p.suffix in {'.ts', '.tsx'}
    and '.docs.' not in p.name
    and '__tests__' not in p.parts
    and 'test' not in p.parts
]
css = sorted((SRC / 'styles').glob('*.css'))

def require_le(label: str, actual: int, limit: int):
    if actual > limit:
        issues.append(f'{label}: {actual} > budget {limit}')

require_le('production TS/TSX modules', len(prod_ts), BUDGET['production_ts_module_max'])
require_le('production TS/TSX bytes', sum(p.stat().st_size for p in prod_ts), BUDGET['production_ts_bytes_max'])
require_le('production CSS files', len(css), BUDGET['production_css_file_max'])
require_le('production CSS bytes', sum(p.stat().st_size for p in css), BUDGET['production_css_bytes_max'])
require_le('runtime dependencies', len(PKG.get('dependencies', {})), BUDGET['runtime_dependency_max'])

unexpected_peers = sorted(set(PKG.get('peerDependencies', {})) - set(BUDGET['allowed_peer_dependencies']))
if unexpected_peers:
    issues.append(f'unreviewed peer dependencies: {unexpected_peers}')

side_effects = PKG.get('sideEffects')
if side_effects != ['./src/styles/*.css', './dist/styles.css']:
    issues.append('package sideEffects must remain limited to source/dist CSS')

exports = PKG.get('exports', {})
legacy_subpaths = [name for name in exports if 'legacy' in name]
require_le('legacy public subpaths', len(legacy_subpaths), BUDGET['legacy_public_subpaths_max'])

studio_refs = 0
for path in prod_ts:
    text = path.read_text(encoding='utf-8')
    studio_refs += len(re.findall(r'apps/ui-studio|@oxs/ui-studio', text))
require_le('Studio references in production UI', studio_refs, BUDGET['studio_imports_in_production_max'])

studio_pkg = json.loads((ROOT / 'apps/ui-studio/package.json').read_text())
for dep in ('react', 'react-dom'):
    ui_version = PKG.get('peerDependencies', {}).get(dep)
    studio_version = studio_pkg.get('dependencies', {}).get(dep)
    if ui_version != studio_version:
        issues.append(f'duplicate React risk: @oxs/ui {dep}={ui_version!r}, Studio {dep}={studio_version!r}')

if issues:
    print('UI source budget gate failed:')
    for issue in issues:
        print(f' - {issue}')
    raise SystemExit(1)

print('UI source budget gate passed:')
print(f'  production modules={len(prod_ts)} bytes={sum(p.stat().st_size for p in prod_ts)}')
print(f'  production CSS files={len(css)} bytes={sum(p.stat().st_size for p in css)}')
print('  runtime deps=0 · CSS-only side effects · React peer parity · Studio excluded · no legacy public subpath')
