import * as UiKit from '@ontologyx/ui';
import {
  Badge,
  Button,
  Code,
  Grid,
  Label,
  Row,
  Select,
  Stack,
  Surface,
  Switch,
  Text,
  TextField,
} from '@ontologyx/ui';
import { createElement, lazy, Suspense, type ComponentType, useMemo, useState } from 'react';
import { CatalogErrorBoundary } from './CatalogErrorBoundary';
import { updateCatalogRoute } from './routing';
import type { UiCatalogEntry, UiCatalogProp } from './types';

function stringUnion(type: string) {
  const parts = type.split('|').map((part) => part.trim());
  if (!parts.length || !parts.every((part) => /^'[^']*'$/.test(part))) return null;
  return parts.map((part) => part.slice(1, -1));
}

function parseDefault(prop: UiCatalogProp): unknown {
  if (!prop.default) return undefined;
  const value = prop.default.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const quoted = value.match(/^['"](.*)['"]$/);
  if (quoted) return quoted[1];
  return undefined;
}

function humanize(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ');
}

function sampleString(entry: UiCatalogEntry, prop: UiCatalogProp) {
  const component = humanize(entry.exportName);
  if (prop.name === 'label' || prop.name === 'ariaLabel' || prop.name.endsWith('Label'))
    return component;
  if (prop.name === 'placeholder' || prop.name.endsWith('Placeholder'))
    return `Try ${component.toLocaleLowerCase()}…`;
  if (prop.name === 'title') return `${component} preview`;
  if (prop.name === 'description') return 'Rendered from the real public @ontologyx/ui export.';
  if (prop.name === 'value') return entry.exportName === 'SearchField' ? 'Launcher' : 'Example';
  if (prop.name === 'query') return '';
  if (prop.name === 'name') return component;
  return '';
}

function controlOptions(entry: UiCatalogEntry, prop: UiCatalogProp) {
  return entry.playground?.options?.[prop.name] ?? stringUnion(prop.type);
}

function seedValue(entry: UiCatalogEntry, prop: UiCatalogProp): unknown {
  const fromDefault = parseDefault(prop);
  if (fromDefault !== undefined) return fromDefault;
  const union = controlOptions(entry, prop);
  if (union?.length) return union[0];
  if (prop.type === 'string') return sampleString(entry, prop);
  if (prop.type === 'number') return 0;
  if (prop.type === 'boolean') return false;
  if (prop.type === 'ReactNode')
    return prop.name === 'description'
      ? 'Rendered from the real public @ontologyx/ui export.'
      : humanize(entry.exportName);
  if (/^\(.*\) => /.test(prop.type) || prop.type.includes('=>')) return () => undefined;
  return undefined;
}

function isSimpleControl(entry: UiCatalogEntry, prop: UiCatalogProp) {
  return (
    prop.type === 'boolean' ||
    prop.type === 'string' ||
    prop.type === 'number' ||
    Boolean(controlOptions(entry, prop))
  );
}

const PRESENTATION_OPTIONALS = new Set([
  'label',
  'title',
  'description',
  'placeholder',
  'ariaLabel',
  'browserLabel',
  'collectionLabel',
  'searchLabel',
  'searchPlaceholder',
  'children',
  'content',
  'primary',
  'secondary',
]);

function initialProps(entry: UiCatalogEntry) {
  const result: Record<string, unknown> = { ...(entry.playground?.fixture ?? {}) };
  for (const prop of entry.props) {
    if (prop.name in result) continue;
    const value = seedValue(entry, prop);
    const shouldPresent =
      !prop.optional || prop.default !== null || PRESENTATION_OPTIONALS.has(prop.name);
    if (value !== undefined && shouldPresent) result[prop.name] = value;
  }
  return result;
}

function canSeedRequiredProps(entry: UiCatalogEntry) {
  const fixture = entry.playground?.fixture ?? {};
  return entry.props
    .filter((prop) => !prop.optional)
    .every((prop) => prop.name in fixture || seedValue(entry, prop) !== undefined);
}

function componentFor(entry: UiCatalogEntry) {
  const candidate = (UiKit as Record<string, unknown>)[entry.exportName];
  return typeof candidate === 'function' || (typeof candidate === 'object' && candidate !== null)
    ? (candidate as ComponentType<Record<string, unknown>>)
    : null;
}

function PlaygroundControl({
  entry,
  prop,
  value,
  onChange,
}: {
  entry: UiCatalogEntry;
  prop: UiCatalogProp;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const union = controlOptions(entry, prop);
  if (prop.type === 'boolean') {
    return (
      <Switch
        label={prop.name}
        description={prop.description || undefined}
        checked={Boolean(value)}
        onCheckedChange={onChange}
      />
    );
  }
  if (union) {
    return (
      <Select
        label={prop.name}
        description={prop.description || undefined}
        options={union.map((item) => ({ value: item, label: item }))}
        value={typeof value === 'string' ? value : (union[0] ?? '')}
        onValueChange={onChange}
      />
    );
  }
  if (prop.type === 'number') {
    return (
      <TextField
        label={prop.name}
        description={prop.description || undefined}
        type="number"
        value={typeof value === 'number' ? String(value) : '0'}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  }
  return (
    <TextField
      label={prop.name}
      description={prop.description || undefined}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function previewPropsForState(entry: UiCatalogEntry, base: Record<string, unknown>, state: string) {
  const next = { ...base };
  const has = (name: string) => entry.props.some((prop) => prop.name === name);
  if (state === 'disabled' && has('disabled')) next.disabled = true;
  if (state === 'loading') {
    if (has('loading')) next.loading = true;
    else if (has('pending')) next.pending = true;
    else if (has('busy')) next.busy = true;
  }
  if (state === 'selected') {
    if (has('selected')) next.selected = true;
    else if (has('checked')) next.checked = true;
    else if (has('pressed')) next.pressed = true;
  }
  if (state === 'error' && has('error')) next.error = 'Validation message';
  if (state === 'read-only' && has('readOnly')) next.readOnly = true;
  return next;
}

function bindInteractiveProps(
  entry: UiCatalogEntry,
  props: Record<string, unknown>,
  onChange?: (next: Record<string, unknown>) => void,
) {
  if (!onChange) return props;
  const next = { ...props };
  const has = (name: string) => entry.props.some((prop) => prop.name === name);
  const bind = (valueName: string, callbackName: string) => {
    if (!has(valueName) || !has(callbackName)) return;
    next[callbackName] = (value: unknown) => onChange({ ...props, [valueName]: value });
  };
  bind('value', 'onValueChange');
  bind('query', 'onQueryChange');
  bind('checked', 'onCheckedChange');
  bind('pressed', 'onPressedChange');
  bind('selected', 'onSelectedChange');
  bind('open', 'onOpenChange');
  return next;
}

function applicableStates(entry: UiCatalogEntry) {
  const names = new Set(entry.props.map((prop) => prop.name));
  const interactive = [
    'Actions',
    'Selection',
    'Fields',
    'Navigation',
    'Data & collection',
    'Overlays',
    'Interaction',
    'Surfaces',
    'Layouts',
    'Chrome',
    'Privileged',
  ].includes(entry.category);
  const states = ['rest'];
  if (interactive) states.push('hover', 'pressed', 'focus');
  if (names.has('disabled')) states.push('disabled');
  if (names.has('loading') || names.has('pending') || names.has('busy')) states.push('loading');
  if (names.has('selected') || names.has('checked') || names.has('pressed'))
    states.push('selected');
  if (names.has('error')) states.push('error');
  if (names.has('readOnly')) states.push('read-only');
  return states;
}

function CanonicalExampleFallback({ entry }: { entry: UiCatalogEntry }) {
  const example = entry.examples[0];
  const Example = useMemo(() => (example ? lazy(example.load) : null), [example]);
  if (!example || !Example) {
    return (
      <Text tone="tertiary">
        This export still needs source-owned preview fixture metadata before it can be rendered
        safely.
      </Text>
    );
  }
  return (
    <Suspense fallback={<Text tone="tertiary">Loading canonical preview…</Text>}>
      <Example />
    </Suspense>
  );
}

function PreviewStage({
  entry,
  props,
  state = 'rest',
  onChange,
  preferCanonicalExample = false,
}: {
  entry: UiCatalogEntry;
  props: Record<string, unknown>;
  state?: string;
  onChange?: (next: Record<string, unknown>) => void;
  preferCanonicalExample?: boolean;
}) {
  const Component = componentFor(entry);
  const preferExample = preferCanonicalExample && entry.examples.length > 0;
  const resolved = bindInteractiveProps(entry, previewPropsForState(entry, props, state), onChange);
  const preferredWidth = entry.playground?.preferredWidth ?? 'wide';
  return (
    <CatalogErrorBoundary label={`${entry.exportName} ${state} preview`}>
      <div
        className="ui-studio-playground__sample"
        data-studio-state={state}
        data-preferred-width={preferredWidth}
      >
        {!preferExample && Component && canSeedRequiredProps(entry) ? (
          createElement(Component, resolved)
        ) : (
          <CanonicalExampleFallback entry={entry} />
        )}
      </div>
    </CatalogErrorBoundary>
  );
}

export function CatalogComponentPreview({
  entry,
  compact = false,
}: {
  entry: UiCatalogEntry;
  compact?: boolean;
}) {
  const seed = useMemo(() => initialProps(entry), [entry]);
  const [values, setValues] = useState<Record<string, unknown>>(seed);
  return (
    <Surface
      material="subtle"
      radius="lg"
      className="ui-studio-component-preview"
      data-compact={compact || undefined}
    >
      <Stack gap="md">
        <Row
          justify="between"
          align="center"
          gap="sm"
          className="ui-studio-component-preview__header"
        >
          <Stack gap="3xs">
            <Label tone="accent" emphasis="strong">
              Live component
            </Label>
            <Text tone="tertiary">
              Real <Code>{`@ontologyx/ui.${entry.exportName}`}</Code> · interactive
            </Text>
          </Stack>
          <Badge tone="success">public export</Badge>
        </Row>
        <PreviewStage entry={entry} props={values} onChange={setValues} preferCanonicalExample />
      </Stack>
    </Surface>
  );
}

export function CatalogPlayground({ entry }: { entry: UiCatalogEntry }) {
  const seed = useMemo(() => initialProps(entry), [entry]);
  const [values, setValues] = useState<Record<string, unknown>>(seed);
  const controls = entry.props.filter((prop) => {
    if (!isSimpleControl(entry, prop)) return false;
    const explicit = entry.playground?.controls;
    return explicit?.length ? explicit.includes(prop.name) : true;
  });
  const states = applicableStates(entry);
  const requestedState = new URLSearchParams(window.location.search).get('state');

  return (
    <Stack gap="xl">
      <Grid columns="auto-fit" minColumn="wide" gap="lg" className="ui-studio-playground">
        <Surface material="subtle" radius="lg" className="ui-studio-playground__canvas">
          <Stack gap="md">
            <Row justify="between" align="center" gap="sm">
              <Stack gap="3xs">
                <Label tone="accent" emphasis="strong">
                  Live preview
                </Label>
                <Text tone="tertiary">Interact with the actual public component.</Text>
              </Stack>
              <Badge tone="success">@ontologyx/ui</Badge>
            </Row>
            <PreviewStage entry={entry} props={values} onChange={setValues} />
          </Stack>
        </Surface>
        <Surface material="subtle" radius="lg" className="ui-studio-playground__controls">
          <Stack gap="md">
            <Label tone="accent" emphasis="strong">
              Safe generated controls
            </Label>
            {controls.length ? (
              controls.map((prop) => (
                <PlaygroundControl
                  key={prop.name}
                  entry={entry}
                  prop={prop}
                  value={values[prop.name] ?? seedValue(entry, prop)}
                  onChange={(value) => setValues((current) => ({ ...current, [prop.name]: value }))}
                />
              ))
            ) : (
              <Text tone="tertiary">
                This component is previewed from source-owned fixture/example data; no scalar
                controls are needed.
              </Text>
            )}
          </Stack>
        </Surface>
      </Grid>

      <Stack gap="md">
        <Stack gap="2xs">
          <Label tone="accent" emphasis="strong">
            Canonical state matrix
          </Label>
          <Text tone="tertiary">
            Every cell renders the real public export. Controlled states are materialized directly;
            hover, pressed and focus remain live interaction targets.
          </Text>
        </Stack>
        <Grid columns="auto-fit" minColumn="card" gap="md" className="ui-studio-state-matrix">
          {states.map((state) => (
            <Surface
              key={state}
              id={`state-${state}`}
              material="subtle"
              radius="md"
              className="ui-studio-state-card ui-studio-deep-target"
              data-active={requestedState === state || undefined}
            >
              <Stack gap="sm">
                <Row className="ui-studio-state-card__header" justify="between" gap="sm">
                  <Badge
                    size="sm"
                    tone={
                      state === 'error' ? 'danger' : state === 'disabled' ? 'neutral' : 'accent'
                    }
                  >
                    {state}
                  </Badge>
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() =>
                      updateCatalogRoute({ tab: 'playground', state, example: null }, 'replace')
                    }
                  >
                    Deep link
                  </Button>
                </Row>
                <PreviewStage entry={entry} props={values} state={state} />
              </Stack>
            </Surface>
          ))}
        </Grid>
      </Stack>

      <Surface material="subtle" radius="md" className="ui-studio-playground__props">
        <Stack gap="xs">
          <Label emphasis="strong">Current props</Label>
          <Code wrap="normal" className="ui-studio-code-anywhere">
            {JSON.stringify(values)}
          </Code>
        </Stack>
      </Surface>
    </Stack>
  );
}
