import {
  AppBar,
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Grid,
  Heading,
  Label,
  Row,
  ScrollView,
  Stack,
  Surface,
  TabPanel,
  Tabs,
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
import { readCatalogRoute, type CatalogTab, updateCatalogRoute } from './routing';
import type { UiCatalogEntry } from './types';

const tabItems = [
  { value: 'overview', label: 'Overview' },
  { value: 'api', label: 'API' },
  { value: 'examples', label: 'Examples' },
  { value: 'playground', label: 'Playground' },
] as const;

function selectedEntry(requested: string | null) {
  return uiCatalog.find((entry) => entry.id === requested) ?? uiCatalog[0];
}

function coverage(entry: UiCatalogEntry) {
  const missing: string[] = [];
  if (!entry.examples.length && !entry.playground) missing.push('preview fixture/example');
  if (entry.props.some((prop) => !prop.description)) missing.push('prop JSDoc');
  if (!entry.accessibility.trim()) missing.push('accessibility guidance');
  if (!entry.rtl.trim()) missing.push('RTL guidance');
  if (!entry.touch.trim()) missing.push('touch guidance');
  if (!entry.responsive.trim()) missing.push('responsive guidance');
  return missing;
}

function GuidanceGrid({ entry }: { entry: UiCatalogEntry }) {
  return (
    <Grid columns="auto-fit" minColumn="wide" gap="md" className="ui-studio-guidance-grid">
      {[
        ['Accessibility', entry.accessibility],
        ['RTL', entry.rtl],
        ['Touch', entry.touch],
        ['Responsive', entry.responsive],
      ].map(([label, value]) => (
        <Surface key={label} material="subtle" radius="md" className="ui-studio-guidance-card">
          <Stack gap="xs">
            <Label emphasis="strong">{label}</Label>
            <Text tone="secondary" selectable>{value}</Text>
          </Stack>
        </Surface>
      ))}
    </Grid>
  );
}

function OverviewPanel({ entry }: { entry: UiCatalogEntry }) {
  const gaps = coverage(entry);
  return (
    <Stack gap="xl">
      <Stack gap="md">
        <Row gap="sm" className="ui-studio-entry-badges">
          <Badge tone="accent">{entry.layer}</Badge>
          <Badge>{entry.category}</Badge>
          <Badge tone={entry.status === 'accepted' ? 'success' : entry.status === 'deprecated' ? 'danger' : 'warning'}>{entry.status}</Badge>
        </Row>
        <Heading level={1} size="display">{entry.exportName}</Heading>
        <Text className="ui-studio-entry-summary" tone="secondary" selectable>{entry.summary}</Text>
        <Text tone="tertiary" selectable>{entry.usage}</Text>
      </Stack>

      <CatalogComponentPreview entry={entry} />

      <Surface material="subtle" radius="md" className="ui-studio-import-card">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">Canonical import</Label>
          <Code wrap="normal" className="ui-studio-code-anywhere">{`import { ${entry.exportName} } from '@ontologyx/ui';`}</Code>
        </Stack>
      </Surface>

      <GuidanceGrid entry={entry} />

      <Surface material="subtle" radius="lg" className="ui-studio-coverage-card">
        <Stack gap="sm">
          <Row justify="between" align="center" gap="sm">
            <Label emphasis="strong">Documentation coverage</Label>
            <Badge tone={gaps.length ? 'warning' : 'success'}>{gaps.length ? `${gaps.length} gaps` : 'complete'}</Badge>
          </Row>
          {gaps.length ? (
            <Text tone="secondary">Missing or incomplete: {gaps.join(', ')}.</Text>
          ) : (
            <Text tone="secondary">Guidance, API metadata, playground metadata and examples are present.</Text>
          )}
        </Stack>
      </Surface>
    </Stack>
  );
}

function ApiPanel({ entry }: { entry: UiCatalogEntry }) {
  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Label tone="accent" emphasis="strong">Generated API</Label>
        <Heading level={2} size="title">Props from TypeScript</Heading>
        <Text tone="tertiary">
          OntologyX UI-owned props only. Native DOM props stay native instead of flooding the generated reference.
        </Text>
      </Stack>
      {entry.props.length ? (
        <Box className="ui-studio-api-table-wrap">
          <table className="ui-studio-api-table" aria-label={`${entry.exportName} props`}>
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">Description</th>
              </tr>
            </thead>
            <tbody>
              {entry.props.map((prop) => (
                <tr key={prop.name} data-deprecated={prop.deprecated || undefined}>
                  <td>
                    <Code>{prop.name}</Code>{prop.optional ? <Text as="span" tone="tertiary">?</Text> : null}
                    {prop.deprecated ? <Badge size="sm" tone="danger">deprecated</Badge> : null}
                  </td>
                  <td><Code wrap="normal" className="ui-studio-code-anywhere">{prop.type}</Code></td>
                  <td>{prop.default ? <Code wrap="normal" className="ui-studio-code-anywhere">{prop.default}</Code> : <Text tone="tertiary">—</Text>}</td>
                  <td><Text tone={prop.description ? 'secondary' : 'tertiary'}>{prop.description || 'No JSDoc yet.'}</Text></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      ) : <Text tone="tertiary">No OntologyX UI-owned public props were extracted for this export.</Text>}
    </Stack>
  );
}

function ExamplesPanel({ entry, requestedExample }: { entry: UiCatalogEntry; requestedExample: string | null }) {
  if (!entry.examples.length) return <Text tone="tertiary">No colocated examples are documented for this export yet.</Text>;
  return (
    <Stack gap="lg">
      {entry.examples.map((example) => (
        <section key={example.id} id={`example-${example.id}`} className="ui-studio-deep-target" data-active={requestedExample === example.id || undefined}>
          <Stack gap="sm">
            <Row justify="end">
              <Button size="sm" variant="ghost" onClick={() => updateCatalogRoute({ tab: 'examples', example: example.id, state: null }, 'replace')}>
                Deep link
              </Button>
            </Row>
            <CatalogExample example={example} />
          </Stack>
        </section>
      ))}
    </Stack>
  );
}

function EntryWorkbench({ entry, tab, requestedExample }: { entry: UiCatalogEntry; tab: CatalogTab; requestedExample: string | null }) {
  const baseId = `studio-${entry.id}`;
  return (
    <Surface
      className="ui-studio-detail"
      material="glass"
      elevation={1}
      radius="lg"
      data-studio-entry={entry.id}
      data-studio-tab={tab}
    >
      <Stack gap="lg">
        <Tabs
          label={`${entry.exportName} documentation sections`}
          items={tabItems.map((item) => ({ ...item, id: `${baseId}-tab-${item.value}`, panelId: `${baseId}-panel-${item.value}` }))}
          value={tab}
          onValueChange={(value) => updateCatalogRoute({ tab: value as CatalogTab, example: value === 'examples' ? requestedExample : null, state: value === 'playground' ? readCatalogRoute().state : null }, 'replace')}
          className="ui-studio-detail__tabs"
        />
        <Divider />
        <Box className="ui-studio-detail__panel">
          <TabPanel value="overview" activeValue={tab} labelledBy={`${baseId}-tab-overview`} id={`${baseId}-panel-overview`}>
            <OverviewPanel entry={entry} />
          </TabPanel>
          <TabPanel value="api" activeValue={tab} labelledBy={`${baseId}-tab-api`} id={`${baseId}-panel-api`}>
            <ApiPanel entry={entry} />
          </TabPanel>
          <TabPanel value="examples" activeValue={tab} labelledBy={`${baseId}-tab-examples`} id={`${baseId}-panel-examples`}>
            <ExamplesPanel entry={entry} requestedExample={requestedExample} />
          </TabPanel>
          <TabPanel value="playground" activeValue={tab} labelledBy={`${baseId}-tab-playground`} id={`${baseId}-panel-playground`}>
            <CatalogPlayground key={entry.id} entry={entry} />
          </TabPanel>
        </Box>
      </Stack>
    </Surface>
  );
}

export function CatalogPage() {
  const [, forceLocation] = useState(0);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const onPopState = () => forceLocation((value) => value + 1);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const route = readCatalogRoute();
  const active = selectedEntry(route.entry);
  const visible = useMemo(() => filterCatalog(uiCatalog, query), [query]);
  const propCount = useMemo(() => uiCatalog.reduce((total, entry) => total + entry.props.length, 0), []);
  const exampleCount = useMemo(() => uiCatalog.reduce((total, entry) => total + entry.examples.length, 0), []);

  useEffect(() => {
    if (active && route.entry !== active.id) {
      updateCatalogRoute({ entry: active.id }, 'replace');
    }
  }, [active, route.entry]);

  useEffect(() => {
    if (!active) return;
    if (route.example && route.tab === 'examples') {
      requestAnimationFrame(() => document.getElementById(`example-${route.example}`)?.scrollIntoView({ block: 'center' }));
    }
    if (route.state && route.tab === 'playground') {
      requestAnimationFrame(() => document.getElementById(`state-${route.state}`)?.scrollIntoView({ block: 'center' }));
    }
  }, [active, route.example, route.state, route.tab]);

  if (!active) return <Text tone="tertiary">No documented public UI entries.</Text>;

  return (
    <Box as="main" className="ui-studio-shell">
      <Box as="aside" className="ui-studio-shell__sidebar">
        <StudioSidebar entries={visible} activeId={active.id} query={query} onQueryChange={setQuery} />
      </Box>
      <Box as="section" className="ui-studio-shell__workspace">
        <AppBar
          className="ui-studio-appbar"
          title={active.exportName}
          subtitle={`${active.layer} / ${active.category}`}
          actions={
            <Row gap="sm">
              <Badge tone="success">{uiCatalog.length} exports</Badge>
              <Badge>{propCount} props</Badge>
              <Badge>{exampleCount} examples</Badge>
            </Row>
          }
        />
        <StudioEnvironmentToolbar />
        <ScrollView className="ui-studio-workspace-scroll" ariaLabel={`${active.exportName} UI documentation`}>
          <Box className="ui-studio-workspace-content">
            <CatalogErrorBoundary label={`${active.exportName} generated detail page`}>
              <EntryWorkbench entry={active} tab={route.tab} requestedExample={route.example} />
            </CatalogErrorBoundary>
          </Box>
        </ScrollView>
      </Box>
    </Box>
  );
}
