#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'apps/ui-studio/src/catalog/generated/catalog.generated.json'
OUT = ROOT / 'apps/ui-studio/src/catalog/generated/fixture-matrix.generated.json'

INTERACTIVE = {'Actions', 'Selection', 'Fields', 'Navigation', 'Data & collection', 'Overlays', 'Interaction', 'Surfaces', 'Layouts', 'Chrome', 'Privileged'}

def literal_union(type_text: str):
    parts = [part.strip() for part in type_text.split('|')]
    if parts and all(len(part) >= 2 and part[0] == part[-1] == "'" for part in parts):
        return [part[1:-1] for part in parts]
    return None

def seedable(entry):
    fixture = (entry.get('playground') or {}).get('fixture', {})
    options = (entry.get('playground') or {}).get('options', {})
    for prop in entry['props']:
        if prop['optional'] or prop['name'] in fixture:
            continue
        t = prop['type']
        if prop.get('default') is not None or prop['name'] in options or literal_union(t):
            continue
        if t in {'string', 'number', 'boolean', 'ReactNode'} or '=>' in t:
            continue
        return False
    return True

def states(entry):
    names = {prop['name'] for prop in entry['props']}
    out = ['rest']
    if entry['category'] in INTERACTIVE:
        out += ['hover', 'focus', 'pressed']
    if 'disabled' in names: out.append('disabled')
    if names & {'loading', 'pending', 'busy'}: out.append('loading')
    if names & {'selected', 'checked', 'pressed'}: out.append('selected')
    if 'error' in names: out.append('error')
    if 'readOnly' in names: out.append('read-only')
    return out

def build():
    catalog = json.loads(CATALOG.read_text())
    fixtures = []
    for entry in catalog:
        if entry.get('playground'):
            mode = 'playground'
        elif seedable(entry):
            mode = 'generated'
        elif entry.get('examples'):
            mode = 'canonical-example'
        else:
            mode = 'missing'
        fixtures.append({
            'id': entry['id'],
            'mode': mode,
            'preferredWidth': (entry.get('playground') or {}).get('preferredWidth', 'wide'),
            'states': states(entry),
            'captures': [
                {'theme': 'dark', 'dir': 'ltr', 'viewport': 'desktop', 'motion': 'full'},
                {'theme': 'light', 'dir': 'rtl', 'viewport': 'tablet', 'motion': 'reduced'},
                {'theme': 'dark', 'dir': 'ltr', 'viewport': 'phone', 'motion': 'reduced'},
            ] if entry['category'] in INTERACTIVE else [
                {'theme': 'dark', 'dir': 'ltr', 'viewport': 'desktop', 'motion': 'reduced'},
            ],
        })
    return {'schema': 1, 'fixtures': fixtures}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    expected = json.dumps(build(), indent=2, ensure_ascii=False) + '\n'
    if args.check:
        if not OUT.exists() or OUT.read_text() != expected:
            print('UI fixture matrix is stale. Run: python3 scripts/generate-fixture-matrix.py')
            raise SystemExit(1)
        data = json.loads(expected)
        missing = [item['id'] for item in data['fixtures'] if item['mode'] == 'missing']
        if missing:
            print(f'UI fixture matrix has unrenderable public exports: {missing}')
            raise SystemExit(1)
        print(f"UI deterministic fixture matrix passed: {len(data['fixtures'])} public exports.")
        return
    OUT.write_text(expected)
    print(f'Wrote {OUT.relative_to(ROOT)}')

if __name__ == '__main__':
    main()
