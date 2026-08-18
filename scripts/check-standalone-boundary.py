#!/usr/bin/env python3
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / 'packages/ui'
UI_SRC = UI / 'src'
STUDIO = ROOT / 'apps/ui-studio'
issues: list[str] = []

for forbidden in ['apps/shell', 'crates', 'contracts', 'Cargo.toml', 'Cargo.lock']:
    if (ROOT / forbidden).exists():
        issues.append(f'product-repository artifact leaked into standalone UI repo: {forbidden}')

pkg = json.loads((UI / 'package.json').read_text())
if pkg.get('private') is True:
    issues.append('@oxs/ui must be publishable, not private')
for required in ['.', './advanced', './styles.css']:
    if required not in pkg.get('exports', {}):
        issues.append(f'missing production package export: {required}')
for name, target in pkg.get('exports', {}).items():
    values = [target] if isinstance(target, str) else list(target.values())
    if any(isinstance(value, str) and '/src/' in value for value in values):
        issues.append(f'public export {name} points at source')
if pkg.get('files') != ['dist', 'README.md', 'LICENSE']:
    issues.append('published file allowlist drifted')
if set(pkg.get('peerDependencies', {})) != {'react', 'react-dom'}:
    issues.append('React/ReactDOM must be the only runtime peers')
if pkg.get('dependencies'):
    issues.append('@oxs/ui must keep zero runtime dependencies')

source_re = re.compile(r"from\s+['\"]([^'\"]+)['\"]|import\s+['\"]([^'\"]+)['\"]")

def import_sources(path: Path) -> list[str]:
    return [next(group for group in match.groups() if group) for match in source_re.finditer(path.read_text())]

prod_files = [
    path for path in [*UI_SRC.rglob('*.ts'), *UI_SRC.rglob('*.tsx')]
    if '.docs.' not in path.name and '__tests__' not in path.parts and 'test' not in path.parts
]
allowed_external = {'react', 'react-dom', 'react-dom/client'}
for path in prod_files:
    text = path.read_text()
    if 'apps/ui-studio' in text or '@oxs/ui-studio' in text:
        issues.append(f'production UI references Studio: {path.relative_to(ROOT)}')
    for source in import_sources(path):
        if source.startswith('@oxs/') or 'apps/shell' in source or 'crates/' in source:
            issues.append(f'production UI source depends on OXS repository internals: {path.relative_to(ROOT)} -> {source}')
        if not source.startswith('.') and source not in allowed_external and not source.startswith('react/') and not source.startswith('react-dom/'):
            issues.append(f'unreviewed runtime package import in production UI: {path.relative_to(ROOT)} -> {source}')

for path in [*UI_SRC.joinpath('system').rglob('*.ts'), *UI_SRC.joinpath('system').rglob('*.tsx')]:
    if '.docs.' in path.name or '__tests__' in path.parts:
        continue
    for source in import_sources(path):
        if re.search(r'(^|/)primitives(?:/|$)', source.replace('\\', '/')):
            issues.append(f'System UI may not import Primitives directly: {path.relative_to(ROOT)} -> {source}')

for path in [*STUDIO.joinpath('src').rglob('*.ts'), *STUDIO.joinpath('src').rglob('*.tsx')]:
    text = path.read_text()
    if 'apps/shell' in text or 'crates/compositor' in text:
        issues.append(f'Studio references product-host internals: {path.relative_to(ROOT)}')

if issues:
    print('Standalone UI boundary check failed:')
    for issue in issues:
        print(' - ' + issue)
    raise SystemExit(1)
print('Standalone UI boundary check passed: isolated workspace · dist exports · zero runtime deps · layer ownership · host-neutral source.')
