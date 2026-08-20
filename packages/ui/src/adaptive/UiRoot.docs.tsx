import { useState } from 'react';
import {
  Badge,
  Button,
  Code,
  Dialog,
  Row,
  Stack,
  Surface,
  Text,
  UI_TOKEN_GROUPS,
  UiRoot,
  Wrap,
} from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'UiRoot',
    layer: 'foundations',
    category: 'Environment',
    order: 10,
    summary:
      'Certified scoped UI environment and runtime boundary for semantic tokens, resolved capabilities, host insets, portals and root-owned services.',
    usage:
      'Wrap each independent UI tree once. Nested UiRoots are detected automatically, inherit environment preferences/tokens by default, and isolate portal/runtime ownership without a manual scope flag.',
    status: 'accepted',
    accessibility:
      'Owns environment/runtime coordination without inventing application roles. Modal isolation, focus restoration and portal ownership remain local to the nearest UiRoot; reduced motion is resolved per owning Window realm.',
    rtl: 'Auto direction inherits the enclosing UiRoot or owning document. Nested roots can override direction explicitly and all public box styling remains logical-property based.',
    touch:
      'Auto pointer precision/density and modality are observed in the concrete owning Window realm. Coarse-pointer target floors remain independent of visual density.',
    responsive:
      'Each root measures its own container for adaptive bands. Persistent safe area and transient occlusion remain separate logical host inputs and nested roots inherit/override them predictably.',
    examples: [
      {
        id: 'token-contract',
        title: 'Semantic token contract',
        component: 'FoundationTokenContractExample',
      },
      {
        id: 'environment-contract',
        title: 'Resolved environment contract',
        component: 'FoundationEnvironmentContractExample',
      },
      {
        id: 'nested-certification',
        title: 'Nested root certification',
        component: 'UiRootNestedCertificationExample',
      },
    ],
  },
] as const);

export function FoundationTokenContractExample() {
  return (
    <Stack gap="md">
      <Text tone="secondary">
        Theme overrides are a finite semantic contract. Runtime mechanics such as z-order, gesture
        physics and scroll physics are intentionally not theme tokens.
      </Text>
      <Wrap gap="xs">
        {(['accent', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Badge key={tone} tone={tone} size="sm">
            {tone}
          </Badge>
        ))}
      </Wrap>
      <Stack gap="sm">
        {Object.entries(UI_TOKEN_GROUPS).map(([group, tokens]) => (
          <Surface key={group} material="subtle" elevation={0} radius="md" border="subtle">
            <Stack gap="xs">
              <Row gap="sm" align="center" justify="between">
                <Text variant="body-strong">{group}</Text>
                <Badge tone="neutral" size="sm">
                  {tokens.length}
                </Badge>
              </Row>
              <Code wrap="normal">{tokens.join(' · ')}</Code>
            </Stack>
          </Surface>
        ))}
      </Stack>
    </Stack>
  );
}

export function FoundationEnvironmentContractExample() {
  const contracts = [
    ['Theme', 'preference → resolved color scheme → semantic tokens'],
    ['Direction', 'auto/LTR/RTL → resolved logical direction'],
    ['Density', 'preference + pointer precision → compact/comfortable'],
    ['Adaptive', 'measured container inline size → compact/medium/expanded/wide'],
    ['Insets', 'persistent safe area + transient occlusion → environment inset'],
    ['Motion', 'system/full/reduced → resolved full/reduced runtime'],
  ] as const;

  return (
    <Stack gap="sm">
      <Text tone="secondary">
        Environment preferences and resolved runtime state are deliberately separate. Components
        consume resolved capabilities, not device names.
      </Text>
      {contracts.map(([name, contract]) => (
        <Surface key={name} material="subtle" elevation={0} radius="md" border="subtle">
          <Stack gap="2xs">
            <Text variant="body-strong">{name}</Text>
            <Code wrap="normal">{contract}</Code>
          </Stack>
        </Surface>
      ))}
    </Stack>
  );
}

export function UiRootNestedCertificationExample() {
  const [open, setOpen] = useState(false);
  return (
    <UiRoot
      theme="dark"
      direction="rtl"
      density="comfortable"
      pointerPrecision="fine"
      safeArea={{ blockStart: '12px' }}
      tokens={{ 'radius-md': '18px' }}
      className="ui-doc-uiroot-outer"
    >
      <Stack gap="sm">
        <Text variant="body-strong">Outer certified scope</Text>
        <Button variant="secondary">Outer action</Button>
        <UiRoot
          density="compact"
          occlusion={{ blockEnd: '40px' }}
          tokens={{ 'radius-md': '6px' }}
          className="ui-doc-uiroot-inner"
        >
          <Stack gap="sm">
            <Text variant="body-strong">Nested certified scope</Text>
            <Button onClick={() => setOpen(true)}>Open nested dialog</Button>
            <Dialog
              open={open}
              onOpenChange={setOpen}
              title="Nested root dialog"
              description="Portal and modal ownership stay inside the nearest UiRoot."
              actions={<Button onClick={() => setOpen(false)}>Done</Button>}
            >
              <Text>Nested runtime ownership is isolated from the enclosing root.</Text>
            </Dialog>
          </Stack>
        </UiRoot>
      </Stack>
    </UiRoot>
  );
}
