import {
  AppBar,
  Badge,
  Box,
  Button,
  Code,
  Disclosure,
  Divider,
  Grid,
  Heading,
  Label,
  Row,
  ScrollView,
  Stack,
  Surface,
  Text,
} from '@ontologyx/ui';
import { useEffect, useMemo, useState } from 'react';
import { StudioEnvironmentToolbar } from '../studio/StudioEnvironmentToolbar';
import { StudioSidebar } from '../studio/StudioSidebar';
import { CatalogErrorBoundary } from './CatalogErrorBoundary';
import { CatalogExample } from './CatalogExample';
import { CatalogComponentPreview, CatalogPlayground } from './CatalogPlayground';
import { uiCatalog } from './generated/catalog.generated';
import { filterCatalog } from './navigation';
import { type CatalogTab, readCatalogRoute, updateCatalogRoute, updateStudioView } from './routing';
import type { UiCatalogEntry } from './types';

const sectionOrder: readonly CatalogTab[] = ['overview', 'api', 'examples', 'playground'];
const repositorySourceBase = 'https://github.com/OntologyXHQ/ui/blob/main/';

function selectedEntry(requested: string | null) {
  return uiCatalog.find((entry) => entry.id === requested) ?? uiCatalog[0];
}

function GuidanceGrid({ entry }: { entry: UiCatalogEntry }) {
  return (
    <Grid columns="auto-fit" minColumn="wide" gap="xs" className="ui-studio-guidance-grid">
      {[
        ['Accessibility', entry.accessibility],
        ['RTL', entry.rtl],
        ['Touch', entry.touch],
        ['Responsive', entry.responsive],
      ].map(([label, value]) => (
        <Box key={label} className="ui-studio-guidance-card">
          <Stack gap="2xs">
            <Label emphasis="strong">{label}</Label>
            <Text tone="secondary" variant="caption" selectable wrap="pretty">
              {value}
            </Text>
          </Stack>
        </Box>
      ))}
    </Grid>
  );
}

function OverviewPanel({ entry }: { entry: UiCatalogEntry }) {
  const certification = entry.certification;
  return (
    <Stack gap="xl">
      <Stack gap="sm" className="ui-studio-entry-hero">
        <Row gap="sm" className="ui-studio-entry-badges">
          <Badge tone="accent">{entry.layer}</Badge>
          <Badge>{entry.category}</Badge>
          <Badge
            tone={
              entry.status === 'accepted'
                ? 'success'
                : entry.status === 'deprecated'
                  ? 'danger'
                  : 'warning'
            }
          >
            {entry.status}
          </Badge>
        </Row>
        <Heading level={1} size="display">
          {entry.exportName}
        </Heading>
      </Stack>

      <CatalogComponentPreview key={entry.id} entry={entry} />

      <Stack gap="xs" className="ui-studio-entry-copy">
        <Text
          className="ui-studio-entry-summary"
          variant="body-strong"
          tone="secondary"
          selectable
          wrap="pretty"
        >
          {entry.summary}
        </Text>
        <Text tone="tertiary" selectable wrap="pretty">
          {entry.usage}
        </Text>
      </Stack>

      <Grid columns="auto-fit" minColumn="wide" gap="md" className="ui-studio-overview-grid">
        <Surface material="subtle" radius="lg" className="ui-studio-import-card">
          <Stack gap="sm">
            <Row justify="between" align="center" gap="sm">
              <Label emphasis="strong">Import</Label>
              <Badge tone="accent">public API</Badge>
            </Row>
            <Code
              wrap="normal"
              className="ui-studio-code-anywhere"
            >{`import { ${entry.exportName} } from '@ontologyx/ui';`}</Code>
          </Stack>
        </Surface>

        <Surface material="subtle" radius="lg" className="ui-studio-contract-card">
          <Stack gap="sm">
            <Label emphasis="strong">Platform contract</Label>
            <GuidanceGrid entry={entry} />
          </Stack>
        </Surface>
      </Grid>

      <Surface
        material="subtle"
        radius="lg"
        className="ui-studio-coverage-card"
        data-studio-acceptance-evidence={certification ? 'bound' : 'unbound'}
      >
        <Disclosure
          summary={certification ? 'Acceptance evidence' : 'Acceptance evidence unavailable'}
          description={
            certification
              ? `${certification.owner} · ${certification.result} · ${certification.requiredAxes.length} required axes`
              : 'This export has not been bound to certification evidence.'
          }
          defaultOpen={false}
          headingLevel={2}
        >
          {certification ? (
            <Stack gap="sm" className="ui-studio-coverage-card__body">
              <Row gap="sm" align="center" className="ui-studio-evidence-summary">
                <Text tone="secondary">
                  Owner: <Code data-studio-certification-owner>{certification.owner}</Code>
                </Text>
                <Badge tone="success" data-studio-certification-result={certification.result}>
                  {certification.result}
                </Badge>
              </Row>
              <Stack gap="xs" data-studio-evidence-links>
                {certification.behaviorTests.map((test, index) => (
                  <Text key={test} tone="secondary" wrap="pretty">
                    G5:{' '}
                    <a
                      className="ui-studio-evidence-link"
                      href={`${repositorySourceBase}${certification.behaviorSources[index]}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Code>{test}</Code>
                    </a>
                  </Text>
                ))}
                {certification.browserScenarios.map((browserScenario) => (
                  <Text key={browserScenario} tone="secondary" wrap="pretty">
                    G6:{' '}
                    <a
                      className="ui-studio-evidence-link"
                      href={`${repositorySourceBase}${certification.browserSource}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Code data-studio-browser-scenario>{browserScenario}</Code>
                    </a>
                  </Text>
                ))}
              </Stack>
              <Text tone="secondary" wrap="pretty">
                Required axes: <Code>{certification.requiredAxes.join(', ')}</Code>
              </Text>
            </Stack>
          ) : (
            <Text tone="secondary">No certification is bound to this export yet.</Text>
          )}
        </Disclosure>
      </Surface>
    </Stack>
  );
}

function ApiPanel({ entry }: { entry: UiCatalogEntry }) {
  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Label tone="accent" emphasis="strong">
          Generated API
        </Label>
        <Heading level={2} size="title">
          Props from TypeScript
        </Heading>
        <Text tone="tertiary" wrap="pretty">
          Public package props generated from TypeScript.
        </Text>
      </Stack>
      <Surface
        material="subtle"
        radius="md"
        className="ui-studio-api-state-model"
        data-studio-state-guidance
      >
        <Stack gap="xs">
          <Label emphasis="strong">State ownership</Label>
          {entry.stateModels.length ? (
            entry.stateModels.map((model) => (
              <Text key={`${model.valueProp}:${model.changeProp}`} tone="secondary" wrap="pretty">
                <Code>{model.valueProp}</Code> + <Code>{model.changeProp}</Code>{' '}
                {model.mode === 'controlled-uncontrolled' && model.defaultProp ? (
                  <>
                    support controlled ownership or uncontrolled initialization through{' '}
                    <Code>{model.defaultProp}</Code>.
                  </>
                ) : (
                  <>form a caller-controlled contract; no uncontrolled default prop is exposed.</>
                )}
              </Text>
            ))
          ) : (
            <Text tone="tertiary" wrap="pretty">
              No controlled value pair is exposed; state is either semantic/internal or driven by
              caller content and event callbacks.
            </Text>
          )}
        </Stack>
      </Surface>
      {entry.props.length ? (
        <Box
          className="ui-studio-api-table-wrap"
          role="region"
          aria-label={`${entry.exportName} API reference`}
          tabIndex={0}
        >
          <table className="ui-studio-api-table" aria-label={`${entry.exportName} props`}>
            <thead>
              <tr>
                <th scope="col">
                  <Label emphasis="strong">Prop</Label>
                </th>
                <th scope="col">
                  <Label emphasis="strong">Type</Label>
                </th>
                <th scope="col">
                  <Label emphasis="strong">Default</Label>
                </th>
                <th scope="col">
                  <Label emphasis="strong">Description</Label>
                </th>
              </tr>
            </thead>
            <tbody>
              {entry.props.map((prop) => (
                <tr key={prop.name} data-deprecated={prop.deprecated || undefined}>
                  <td>
                    <Code>{prop.name}</Code>
                    {prop.optional ? (
                      <Text as="span" variant="caption" tone="tertiary">
                        ?
                      </Text>
                    ) : null}
                    {prop.deprecated ? (
                      <Badge size="sm" tone="danger">
                        deprecated
                      </Badge>
                    ) : null}
                  </td>
                  <td>
                    <Code wrap="normal" className="ui-studio-code-anywhere">
                      {prop.type}
                    </Code>
                  </td>
                  <td>
                    {prop.default ? (
                      <Code wrap="normal" className="ui-studio-code-anywhere">
                        {prop.default}
                      </Code>
                    ) : (
                      <Text tone="tertiary">—</Text>
                    )}
                  </td>
                  <td>
                    <Text tone={prop.description ? 'secondary' : 'tertiary'} wrap="pretty">
                      {prop.description || 'No JSDoc yet.'}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      ) : (
        <Text tone="tertiary">
          No OntologyX UI-owned public props were extracted for this export.
        </Text>
      )}
    </Stack>
  );
}

function ExamplesPanel({
  entry,
  requestedExample,
}: {
  entry: UiCatalogEntry;
  requestedExample: string | null;
}) {
  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Label tone="accent" emphasis="strong">
          Source-owned examples
        </Label>
        <Heading level={2} size="title">
          Examples
        </Heading>
        <Text tone="tertiary" wrap="pretty">
          Public-package examples rendered inline for direct comparison.
        </Text>
      </Stack>
      {entry.examples.length ? (
        entry.examples.map((example) => (
          <section
            key={example.id}
            id={`example-${example.id}`}
            className="ui-studio-deep-target"
            data-active={requestedExample === example.id || undefined}
          >
            <Stack gap="sm">
              <Row justify="end">
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() =>
                    updateCatalogRoute(
                      { tab: 'examples', example: example.id, state: null },
                      'replace',
                    )
                  }
                >
                  Deep link
                </Button>
              </Row>
              <CatalogExample example={example} />
            </Stack>
          </section>
        ))
      ) : (
        <Text tone="tertiary">No colocated examples are documented for this export yet.</Text>
      )}
    </Stack>
  );
}

function PlaygroundSection({ entry }: { entry: UiCatalogEntry }) {
  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Label tone="accent" emphasis="strong">
          Interactive inspection
        </Label>
        <Heading level={2} size="title">
          Playground & state matrix
        </Heading>
        <Text tone="tertiary" wrap="pretty">
          Adjust safe props and inspect canonical component states.
        </Text>
      </Stack>
      <CatalogPlayground key={entry.id} entry={entry} />
    </Stack>
  );
}

function EntryWorkbench({
  entry,
  tab,
  requestedExample,
}: {
  entry: UiCatalogEntry;
  tab: CatalogTab;
  requestedExample: string | null;
}) {
  return (
    <Surface
      className="ui-studio-detail"
      material="glass"
      elevation={1}
      radius="lg"
      data-studio-entry={entry.id}
      data-studio-tab={tab}
      data-studio-layout="stacked"
    >
      <Stack gap="2xl" className="ui-studio-detail__flow">
        <Box
          as="section"
          id="studio-section-overview"
          className="ui-studio-detail__section"
          data-active={tab === 'overview' || undefined}
          data-studio-section="overview"
        >
          <OverviewPanel entry={entry} />
        </Box>
        <Divider />
        <Box
          as="section"
          id="studio-section-api"
          className="ui-studio-detail__section"
          data-active={tab === 'api' || undefined}
          data-studio-section="api"
        >
          <ApiPanel entry={entry} />
        </Box>
        <Divider />
        <Box
          as="section"
          id="studio-section-examples"
          className="ui-studio-detail__section"
          data-active={tab === 'examples' || undefined}
          data-studio-section="examples"
        >
          <ExamplesPanel entry={entry} requestedExample={requestedExample} />
        </Box>
        <Divider />
        <Box
          as="section"
          id="studio-section-playground"
          className="ui-studio-detail__section"
          data-active={tab === 'playground' || undefined}
          data-studio-section="playground"
        >
          <PlaygroundSection entry={entry} />
        </Box>
      </Stack>
    </Surface>
  );
}

export function CatalogPage() {
  const [, forceLocation] = useState(0);
  useEffect(() => {
    const onPopState = () => forceLocation((value) => value + 1);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const route = readCatalogRoute();
  const active = selectedEntry(route.entry);
  const visible = useMemo(
    () =>
      filterCatalog(uiCatalog, route.query, {
        layer: route.layer,
        status: route.status,
      }),
    [route.layer, route.query, route.status],
  );
  useEffect(() => {
    if (active && route.entry !== active.id) {
      updateCatalogRoute({ entry: active.id }, 'replace');
    }
  }, [active, route.entry]);

  useEffect(() => {
    if (!active) return;
    const scrollTo = (id: string, block: ScrollLogicalPosition = 'start') => {
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block }));
    };
    if (route.example && route.tab === 'examples') {
      scrollTo(`example-${route.example}`, 'center');
      return;
    }
    if (route.state && route.tab === 'playground') {
      scrollTo(`state-${route.state}`, 'center');
      return;
    }
    if (sectionOrder.includes(route.tab)) scrollTo(`studio-section-${route.tab}`);
  }, [active, route.example, route.state, route.tab]);

  if (!active) return <Text tone="tertiary">No documented public UI entries.</Text>;

  return (
    <Box as="main" className="ui-studio-shell">
      <Box as="aside" className="ui-studio-shell__sidebar">
        <StudioSidebar
          entries={visible}
          activeId={active.id}
          query={route.query}
          layer={route.layer}
          status={route.status}
          onQueryChange={(query) => updateCatalogRoute({ query }, 'replace')}
          onLayerChange={(layer) => updateCatalogRoute({ layer }, 'replace')}
          onStatusChange={(status) => updateCatalogRoute({ status }, 'replace')}
        />
      </Box>
      <Box as="section" className="ui-studio-shell__workspace">
        <AppBar
          className="ui-studio-appbar"
          title="OntologyX UI Studio"
          subtitle={`${active.exportName} · ${active.layer} / ${active.category}`}
          actions={
            <Row gap="sm" align="center">
              <Button size="sm" variant="quiet" onClick={() => updateStudioView('semantic')}>
                Semantic V2
              </Button>
              <Badge tone="success">{uiCatalog.length} exports</Badge>
            </Row>
          }
        />
        <StudioEnvironmentToolbar />
        <ScrollView
          className="ui-studio-workspace-scroll"
          ariaLabel={`${active.exportName} UI documentation`}
        >
          <Box className="ui-studio-workspace-content">
            <CatalogErrorBoundary
              key={active.id}
              label={`${active.exportName} generated detail page`}
              resetKey={active.id}
            >
              <EntryWorkbench entry={active} tab={route.tab} requestedExample={route.example} />
            </CatalogErrorBoundary>
          </Box>
        </ScrollView>
      </Box>
    </Box>
  );
}
