#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / 'apps' / 'ui-studio' / 'src'
UI = ROOT / 'packages' / 'ui'
errors: list[str] = []

required = [
    STUDIO / 'catalog' / 'CatalogPage.tsx',
    STUDIO / 'catalog' / 'CatalogPlayground.tsx',
    STUDIO / 'catalog' / 'navigation.ts',
    STUDIO / 'catalog' / 'routing.ts',
    STUDIO / 'studio' / 'StudioEnvironment.tsx',
    STUDIO / 'studio' / 'StudioEnvironmentToolbar.tsx',
    STUDIO / 'studio' / 'StudioSidebar.tsx',
    STUDIO / 'studio' / 'UiKitStudio.tsx',
    UI / 'src' / 'docs' / 'defineUiDocs.ts',
]
for path in required:
    if not path.exists():
        errors.append(f'missing UIP13 self-hosting artifact: {path.relative_to(ROOT)}')

# Studio may compose semantic/layout wrappers, but reusable controls must come from @oxs/ui.
raw_control = re.compile(r'<(?:button|input|select|textarea)\b')
for path in STUDIO.rglob('*.tsx'):
    text = path.read_text(encoding='utf-8')
    if raw_control.search(text):
        errors.append(f'Studio contains raw reusable control instead of @oxs/ui: {path.relative_to(ROOT)}')

studio = (STUDIO / 'studio' / 'UiKitStudio.tsx').read_text(encoding='utf-8')
for forbidden in ['currentView()', "view ===", "get('view')"]:
    if forbidden in studio:
        errors.append(f'UiKitStudio still owns a hand-maintained page switcher: {forbidden}')
for marker in ['StudioEnvironmentProvider', 'CatalogPage']:
    if marker not in studio:
        errors.append(f'UiKitStudio is missing generated workbench owner: {marker}')

sidebar = (STUDIO / 'studio' / 'StudioSidebar.tsx').read_text(encoding='utf-8')
for marker in ['groupCatalog', 'ScrollView', 'SearchField', 'ListSection', 'ListItem', 'updateCatalogRoute']:
    if marker not in sidebar:
        errors.append(f'generated Studio sidebar is missing @oxs/ui/catalog marker: {marker}')

catalog_page = (STUDIO / 'catalog' / 'CatalogPage.tsx').read_text(encoding='utf-8')
for marker in ['StudioSidebar', 'StudioEnvironmentToolbar', 'Tabs', 'TabPanel', 'CatalogPlayground', 'filterCatalog']:
    if marker not in catalog_page:
        errors.append(f'generated Studio workbench is missing marker: {marker}')

navigation = (STUDIO / 'catalog' / 'navigation.ts').read_text(encoding='utf-8')
for marker in ['entry.props.flatMap', 'entry.examples.flatMap', 'entry.accessibility', 'entry.rtl', 'entry.touch', 'entry.responsive', 'entry.order']:
    if marker not in navigation:
        errors.append(f'catalog search/navigation is missing generated metadata axis: {marker}')

environment = (STUDIO / 'studio' / 'StudioEnvironment.tsx').read_text(encoding='utf-8')
for marker in ['UiRoot', 'theme=', 'direction=', 'density=', 'modality=', 'pointerPrecision=', 'safeArea=', 'motion=', 'tokens=', 'viewportWidths', 'containerWidths']:
    if marker not in environment:
        errors.append(f'global Studio environment is missing UiRoot ownership marker: {marker}')

toolbar = (STUDIO / 'studio' / 'StudioEnvironmentToolbar.tsx').read_text(encoding='utf-8')
for marker in ['Toolbar', 'Select', 'Theme', 'Direction', 'Density', 'Motion', 'Input modality', 'Pointer precision', 'Viewport preset', 'Content container preset', 'Safe area and occlusion']:
    if marker not in toolbar:
        errors.append(f'global Studio toolbar is missing control: {marker}')

css = (STUDIO / 'styles' / 'studio.css').read_text(encoding='utf-8')
for marker in [
    '.ui-studio-sidebar__scroll',
    'flex: 1 1 auto;',
    'min-height: 0;',
    'height: 0;',
    '.ui-studio-shell__workspace',
    'grid-template-rows: auto auto minmax(0, 1fr);',
]:
    if marker not in css:
        errors.append(f'Studio fixed-header/scroll ownership CSS is missing marker: {marker}')

defs = (UI / 'src' / 'docs' / 'defineUiDocs.ts').read_text(encoding='utf-8')
for marker in ['order: number', 'fixture?:', 'options?:']:
    if marker not in defs:
        errors.append(f'generated catalog metadata contract is missing: {marker}')

for path in (UI / 'src').rglob('*.docs.tsx'):
    for line_no, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        if 'category:' in line and 'order:' not in line:
            errors.append(f'UI docs category lacks source-owned navigation order: {path.relative_to(ROOT)}:{line_no}')

legacy_nav = (STUDIO / 'studio' / 'StudioNav.tsx').read_text(encoding='utf-8')
if legacy_nav.count('<Button') > 1:
    errors.append('historical StudioNav still contains a parallel hand-maintained navigation menu')
if 'generated workbench' not in legacy_nav:
    errors.append('historical diagnostic navigation must point back to the generated workbench')

if errors:
    print('UI Studio self-hosting check failed:')
    for error in errors:
        print(f' - {error}')
    raise SystemExit(1)

print('UI Studio self-hosting check passed.')
