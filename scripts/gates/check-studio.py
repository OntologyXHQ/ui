#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STUDIO = ROOT / 'apps' / 'ui-studio' / 'src'
ENTRY = STUDIO / 'main.tsx'
issues: list[str] = []

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

allowed_external = {'react', 'react-dom', 'react-dom/client', '@ontologyx/ui'}
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

if issues:
    print('G4 Studio integrity gate failed:')
    for issue in issues:
        print(f' - {issue}')
    raise SystemExit(1)

print(f'G4 Studio integrity gate passed: {len(reachable)} reachable TS/TSX modules · no dead Studio modules · public UI controls only · no host/source deep imports.')
