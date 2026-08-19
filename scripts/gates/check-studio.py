#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STUDIO = ROOT / 'apps' / 'ui-studio' / 'src'
ENTRY = STUDIO / 'main.tsx'

DOCS_ROOT = ROOT / 'packages' / 'ui' / 'src'
DOCS_HELPER = '../docs/defineUiDocs'
issues: list[str] = []

# The public package intentionally keeps JavaScript entries stylesheet-neutral.
# Studio is a browser host, so it must compose the public stylesheet explicitly
# before Studio-local CSS. This is a host contract, not a source-text marker:
# without it the Studio would exercise unstyled DOM while claiming to dogfood
# the published UI package.
entry_text = ENTRY.read_text(encoding='utf-8')
public_styles_import = "import '@ontologyx/ui/styles.css';"
studio_styles_import = "import './styles/studio.css';"
studio_css_path = STUDIO / 'styles' / 'studio.css'
studio_css = studio_css_path.read_text(encoding='utf-8')
workbench_marker = '/* Self-hosted generated Studio workbench */'
if workbench_marker not in studio_css:
    issues.append('Studio stylesheet must retain the self-hosted workbench boundary marker')
else:
    workbench_css = studio_css.split(workbench_marker, 1)[1]
    if re.search(r'@media\s*\(', workbench_css):
        issues.append('self-hosted Studio workbench must adapt to its UiRoot container; browser viewport @media queries are forbidden')
    required_container_breakpoints = {'68rem', '52rem', '32rem', '76rem', '58rem'}
    present_container_breakpoints = set(
        re.findall(r'@container\s+oxs-ui\s*\(max-width:\s*([^\)]+)\)', workbench_css)
    )
    missing_container_breakpoints = required_container_breakpoints - present_container_breakpoints
    if missing_container_breakpoints:
        issues.append(
            'self-hosted Studio workbench is missing container-first breakpoints: ' + ', '.join(sorted(missing_container_breakpoints))
        )

if entry_text.count(public_styles_import) != 1:
    issues.append('Studio browser host must import @ontologyx/ui/styles.css exactly once from main.tsx')
if entry_text.count(studio_styles_import) != 1:
    issues.append('Studio main.tsx must import its local stylesheet exactly once')
if public_styles_import in entry_text and studio_styles_import in entry_text:
    if entry_text.index(public_styles_import) > entry_text.index(studio_styles_import):
        issues.append('Studio must load @ontologyx/ui/styles.css before Studio-local CSS')

module_files = {
    path.resolve()
    for path in STUDIO.rglob('*')
    if path.is_file() and path.suffix in {'.ts', '.tsx'} and path.name != 'vite-env.d.ts'
}

import_re = re.compile(
    r"(?:from\s+|import\s*\(\s*|import\s+)['\"]([^'\"]+)['\"]"
)
raw_control_re = re.compile(r'<\s*(button|input|select|textarea)\b')


def resolve_relative(source: Path, specifier: str) -> Path | None:
    if not specifier.startswith('.'):
        return None
    base = source.parent / specifier
    candidates = [base]
    if base.suffix not in {'.ts', '.tsx'}:
        candidates.extend(Path(str(base) + ext) for ext in ('.ts', '.tsx'))
        candidates.extend(base / f'index{ext}' for ext in ('.ts', '.tsx'))
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate.resolve()
    return None

reachable: set[Path] = set()
stack = [ENTRY.resolve()]
while stack:
    path = stack.pop()
    if path in reachable or not path.exists():
        continue
    reachable.add(path)
    text = path.read_text(encoding='utf-8')
    for match in import_re.finditer(text):
        target = resolve_relative(path, match.group(1))
        if target is not None and target in module_files:
            stack.append(target)

for path in sorted(module_files - reachable):
    issues.append(f'unreachable Studio module: {path.relative_to(ROOT)}')

allowed_external = {'react', 'react-dom', 'react-dom/client', '@ontologyx/ui', '@ontologyx/ui/styles.css'}
for path in sorted(module_files):
    text = path.read_text(encoding='utf-8')
    if raw_control_re.search(text):
        issues.append(f'raw reusable control in self-hosted Studio: {path.relative_to(ROOT)}')
    if '@ontologyx/ui/src' in text or 'packages/ui/src' in text:
        issues.append(f'Studio deep-imports UI source instead of package API: {path.relative_to(ROOT)}')
    if '@oxs/' in text or 'apps/shell' in text or 'crates/' in text:
        issues.append(f'Studio references host/product internals: {path.relative_to(ROOT)}')
    for match in import_re.finditer(text):
        specifier = match.group(1)
        if specifier.startswith('.') or specifier.startswith('@ontologyx/ui-docs/'):
            continue
        if specifier not in allowed_external and not specifier.startswith('react/') and not specifier.startswith('react-dom/'):
            issues.append(f'unreviewed Studio external import: {path.relative_to(ROOT)} -> {specifier}')


# Colocated docs modules are executable Studio code whenever they own examples.
# They may use the local metadata helper, but every runtime UI symbol must flow
# through the same public package entry that consumers use. Relative visual
# imports would instantiate a second source graph and can split UiRoot/portal
# contexts from the package instance exercised by Studio.
for path in sorted(DOCS_ROOT.rglob('*.docs.tsx')):
    text = path.read_text(encoding='utf-8')
    for match in import_re.finditer(text):
        specifier = match.group(1)
        if specifier in {'react', '@ontologyx/ui', DOCS_HELPER}:
            continue
        if specifier.startswith('react/'):
            continue
        issues.append(
            f'docs runtime bypasses public package API: {path.relative_to(ROOT)} -> {specifier}'
        )

if issues:
    print('G4 Studio integrity gate failed:')
    for issue in issues:
        print(f' - {issue}')
    raise SystemExit(1)

print(f'G4 Studio integrity gate passed: {len(reachable)} reachable TS/TSX modules · no dead Studio modules · Studio/docs runtime uses public @ontologyx/ui only · no host/source deep imports.')
