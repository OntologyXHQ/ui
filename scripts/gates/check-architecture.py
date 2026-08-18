#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UI = ROOT / 'packages' / 'ui'
SRC = UI / 'src'
STUDIO = ROOT / 'apps' / 'ui-studio'
issues: list[str] = []

root_pkg = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
pkg = json.loads((UI / 'package.json').read_text(encoding='utf-8'))
studio_pkg = json.loads((STUDIO / 'package.json').read_text(encoding='utf-8'))

# Repository/package contract.
for forbidden in ('apps/shell', 'crates', 'contracts', 'Cargo.toml', 'Cargo.lock'):
    if (ROOT / forbidden).exists():
        issues.append(f'host/product artifact leaked into standalone UI repository: {forbidden}')

if pkg.get('name') != '@ontologyx/ui':
    issues.append(f"public package identity drifted: {pkg.get('name')!r}")
if pkg.get('private') is True:
    issues.append('@ontologyx/ui must remain publishable')
if pkg.get('type') != 'module':
    issues.append('@ontologyx/ui must remain an ESM package')
if pkg.get('dependencies'):
    issues.append('@ontologyx/ui must keep zero production runtime dependencies')
if set(pkg.get('peerDependencies', {})) != {'react', 'react-dom'}:
    issues.append('React and ReactDOM must be the only production peer dependencies')
if pkg.get('sideEffects') != ['./dist/styles.css']:
    issues.append('package sideEffects must remain limited to ./dist/styles.css')
if pkg.get('files') != ['dist', 'README.md', 'LICENSE']:
    issues.append('published file allowlist must remain dist + README + LICENSE')

exports = pkg.get('exports', {})
for required in ('.', './advanced', './styles.css', './package.json'):
    if required not in exports:
        issues.append(f'missing package export: {required}')
for name, target in exports.items():
    values = [target] if isinstance(target, str) else list(target.values()) if isinstance(target, dict) else []
    for value in values:
        if isinstance(value, str) and value.startswith('./src/'):
            issues.append(f'package export points to source instead of dist: {name} -> {value}')

for peer in ('react', 'react-dom'):
    if studio_pkg.get('dependencies', {}).get(peer) != pkg.get('peerDependencies', {}).get(peer):
        issues.append(f'Studio/{peer} version must match @ontologyx/ui peer version exactly')
if studio_pkg.get('dependencies', {}).get('@ontologyx/ui') != 'workspace:*':
    issues.append('Studio must consume @ontologyx/ui through the workspace package boundary')

studio_vite = (STUDIO / 'vite.config.ts').read_text(encoding='utf-8')
if '@oxs/ui' in studio_vite:
    issues.append('Studio Vite config still contains stale pre-rename @oxs/ui aliases')

# Browser acceptance tooling must stay browser-download-free. The repository drives an installed
# system Chrome/Chromium through playwright-core and injects axe-core into that real document.
root_dev = root_pkg.get('devDependencies', {})
exact_semver = re.compile(r'^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$')
for browser_dev_dependency in ('playwright-core', 'axe-core'):
    value = root_dev.get(browser_dev_dependency)
    if not isinstance(value, str) or not exact_semver.fullmatch(value):
        issues.append(f'G6 dependency {browser_dev_dependency} must be present and exact-pinned, got {value!r}')
for forbidden_browser_package in ('playwright', '@playwright/test'):
    if forbidden_browser_package in root_dev:
        issues.append(f'G6 must not depend on browser-downloading package {forbidden_browser_package}; use playwright-core + system browser')

# Source dependency zones. Internal engines are infrastructure, not a fifth public visual layer.
zone_by_dir = {
    'foundations': 'foundations',
    'primitives': 'primitives',
    'components': 'components',
    'adaptive': 'components',
    'system': 'system',
    'cursor': 'engine',
    'drag-drop': 'engine',
    'editing': 'engine',
    'gestures': 'engine',
    'interaction': 'engine',
    'motion': 'engine',
    'scroll': 'engine',
}
allowed_zone_edges = {
    'foundations': {'foundations'},
    'primitives': {'foundations', 'primitives'},
    'engine': {'foundations', 'engine'},
    'components': {'foundations', 'primitives', 'engine', 'components'},
    'system': {'components', 'system'},
}

import_re = re.compile(
    r"(?:from\s+|import\s*\(\s*|import\s+)['\"]([^'\"]+)['\"]"
)
allowed_external = {'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'}


def production_files() -> list[Path]:
    result: list[Path] = []
    for path in [*SRC.rglob('*.ts'), *SRC.rglob('*.tsx')]:
        if '.docs.' in path.name or '__tests__' in path.parts or path.name.endswith('.test.ts') or path.name.endswith('.test.tsx'):
            continue
        if path.parts[-2:] == ('test', 'setup.ts'):
            continue
        result.append(path)
    return sorted(result)


def resolve_relative(source: Path, specifier: str) -> Path | None:
    base = source.parent / specifier
    candidates = [base]
    if base.suffix not in {'.ts', '.tsx'}:
        candidates.extend(Path(str(base) + ext) for ext in ('.ts', '.tsx'))
        candidates.extend(base / f'index{ext}' for ext in ('.ts', '.tsx'))
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate.resolve()
    return None

for path in production_files():
    rel = path.relative_to(SRC)
    top = rel.parts[0]
    text = path.read_text(encoding='utf-8')
    if 'apps/ui-studio' in text or '@ontologyx/ui-studio' in text:
        issues.append(f'production source references Studio: {path.relative_to(ROOT)}')
    if '@oxs/' in text or 'apps/shell' in text or 'crates/' in text:
        issues.append(f'production source references host/product internals: {path.relative_to(ROOT)}')

    # Root entrypoints and docs support are boundary files; their export graph is intentional.
    source_zone = zone_by_dir.get(top)
    for match in import_re.finditer(text):
        specifier = match.group(1)
        if not specifier.startswith('.'):
            if specifier not in allowed_external and not specifier.startswith('react/') and not specifier.startswith('react-dom/'):
                issues.append(f'unreviewed external production import: {path.relative_to(ROOT)} -> {specifier}')
            continue
        target = resolve_relative(path, specifier)
        if target is None:
            # CSS and declaration-only imports are checked by TypeScript/build gates.
            continue
        try:
            target_rel = target.relative_to(SRC.resolve())
        except ValueError:
            issues.append(f'production relative import escapes packages/ui/src: {path.relative_to(ROOT)} -> {specifier}')
            continue
        target_zone = zone_by_dir.get(target_rel.parts[0])
        if source_zone and target_zone and target_zone not in allowed_zone_edges[source_zone]:
            issues.append(
                f'forbidden dependency direction {source_zone} -> {target_zone}: '
                f'{path.relative_to(ROOT)} -> {target_rel}'
            )

if issues:
    print('G0 architecture gate failed:')
    for issue in issues:
        print(f' - {issue}')
    raise SystemExit(1)

print('G0 architecture gate passed: package boundary · zero runtime deps · explicit CSS · source-zone dependency direction · host isolation · system-browser G6 tooling.')
