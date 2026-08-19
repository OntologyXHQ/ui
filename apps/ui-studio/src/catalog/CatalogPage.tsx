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

const sectionOrder: readonly CatalogTab[] = ['overview', 'api', 'examples', 'playground'];

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
      <Stack gap="md" className="ui-studio-entry-hero">
        <Label tone="accent" emphasis="strong">Component profile</Label>
        <Row gap="sm" className="ui-studio-entry-badges">
          <Badge tone="accent">{entry.layer}</Badge>
          <Badge>{entry.category}</Badge>
          <Badge tone={entry.status === 'accepted' ? 'success' : entry.status === 'deprecated' ? 'danger' : 'warning'}>{entry.status}</Badge>
        </Row>
        <Heading level={1} size="display">{entry.exportName}</Heading>
        <Text className="ui-studio-entry-summary" variant="body-strong" tone="secondary" selectable wrap="pretty">{entry.summary}</Text>
        <Text tone="tertiary" selectable wrap="pretty">{entry.usage}</Text>
      </Stack>

      <CatalogComponentPreview entry={entry} />

      <Surface material="subtle" radius="md" className="ui-studio-import-card">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">Canonical import</Label>
          <Code wrap="normal" className="ui-studio-code-anywhere">{`import { ${entry.exportName} } from '@ontologyx/ui';`}</Code>
        </Stack>
      </Surface>

      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">Behavior guidance</Label>
          <Heading level={2} size="title">Use it without breaking the platform contract</Heading>
          <Text tone="tertiary" wrap="pretty">Accessibility, direction, touch and adaptation stay visible in the same reading flow.</Text>
        </Stack>
        <GuidanceGrid entry={entry} />
      </Stack>

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
        <Text tone="tertiary" wrap="pretty">
          OntologyX UI-owned props only. Native DOM props stay native instead of flooding the generated reference.
        </Text>
      </Stack>
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
                <th scope="col"><Label emphasis="strong">Prop</Label></th>
                <th scope="col"><Label emphasis="strong">Type</Label></th>
                <th scope="col"><Label emphasis="strong">Default</Label></th>
                <th scope="col"><Label emphasis="strong">Description</Label></th>
              </tr>
            </thead>
            <tbody>
              {entry.props.map((prop) => (
                <tr key={prop.name} data-deprecated={prop.deprecated || undefined}>
                  <td>
                    <Code>{prop.name}</Code>{prop.optional ? <Text as="span" variant="caption" tone="tertiary">?</Text> : null}
                    {prop.deprecated ? <Badge size="sm" tone="danger">deprecated</Badge> : null}
                  </td>
                  <td><Code wrap="normal" className="ui-studio-code-anywhere">{prop.type}</Code></td>
                  <td>{prop.default ? <Code wrap="normal" className="ui-studio-code-anywhere">{prop.default}</Code> : <Text tone="tertiary">—</Text>}</td>
                  <td><Text tone={prop.description ? 'secondary' : 'tertiary'} wrap="pretty">{prop.description || 'No JSDoc yet.'}</Text></td>
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
  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Label tone="accent" emphasis="strong">Source-owned examples</Label>
        <Heading level={2} size="title">Examples</Heading>
        <Text tone="tertiary" wrap="pretty">Real public-package examples stay in the document flow so comparison never requires switching context.</Text>
      </Stack>
      {entry.examples.length ? entry.examples.map((example) => (
        <section key={example.id} id={`example-${example.id}`} className="ui-studio-deep-target" data-active={requestedExample === example.id || undefined}>
          <Stack gap="sm">
            <Row justify="end">
              <Button size="sm" variant="quiet" onClick={() => updateCatalogRoute({ tab: 'examples', example: example.id, state: null }, 'replace')}>
                Deep link
              </Button>
            </Row>
            <CatalogExample example={example} />
          </Stack>
        </section>
      )) : <Text tone="tertiary">No colocated examples are documented for this export yet.</Text>}
    </Stack>
  );
}

function PlaygroundSection({ entry }: { entry: UiCatalogEntry }) {
  return (
    <Stack gap="lg">
      <Stack gap="2xs">
        <Label tone="accent" emphasis="strong">Interactive inspection</Label>
        <Heading level={2} size="title">Playground & state matrix</Heading>
        <Text tone="tertiary" wrap="pretty">Tune safe scalar props and inspect canonical states without leaving this component page.</Text>
      </Stack>
      <CatalogPlayground key={entry.id} entry={entry} />
    </Stack>
  );
}

function EntryWorkbench({ entry, tab, requestedExample }: { entry: UiCatalogEntry; tab: CatalogTab; requestedExample: string | null }) {
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
        <Box as="section" id="studio-section-overview" className="ui-studio-detail__section" data-active={tab === 'overview' || undefined} data-studio-section="overview">
          <OverviewPanel entry={entry} />
        </Box>
        <Divider />
        <Box as="section" id="studio-section-api" className="ui-studio-detail__section" data-active={tab === 'api' || undefined} data-studio-section="api">
          <ApiPanel entry={entry} />
        </Box>
        <Divider />
        <Box as="section" id="studio-section-examples" className="ui-studio-detail__section" data-active={tab === 'examples' || undefined} data-studio-section="examples">
          <ExamplesPanel entry={entry} requestedExample={requestedExample} />
        </Box>
        <Divider />
        <Box as="section" id="studio-section-playground" className="ui-studio-detail__section" data-active={tab === 'playground' || undefined} data-studio-section="playground">
          <PlaygroundSection entry={entry} />
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
