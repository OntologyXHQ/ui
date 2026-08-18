import { Label, Stack, Surface, Text } from '@ontologyx/ui';
import { lazy, Suspense, useMemo } from 'react';
import { CatalogErrorBoundary } from './CatalogErrorBoundary';
import type { UiCatalogExample } from './types';

export function CatalogExample({ example }: { example: UiCatalogExample }) {
  const Example = useMemo(() => lazy(example.load), [example]);
  return (
    <Surface className="ui-catalog-example" material="subtle" radius="lg">
      <Stack gap="md">
        <Stack gap="2xs">
          <Label emphasis="strong">{example.title}</Label>
          {example.description ? <Text tone="tertiary">{example.description}</Text> : null}
        </Stack>
        <CatalogErrorBoundary label={example.title}>
          <Suspense fallback={<Text tone="tertiary">Loading example…</Text>}>
            <div className="ui-catalog-example__canvas">
              <Example />
            </div>
          </Suspense>
        </CatalogErrorBoundary>
      </Stack>
    </Surface>
  );
}
