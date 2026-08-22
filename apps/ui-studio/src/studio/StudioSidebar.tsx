import {
  Badge,
  Box,
  Label,
  List,
  ListItem,
  ListSection,
  Row,
  ScrollView,
  SearchField,
  Select,
  Stack,
  Surface,
  Text,
} from '@ontologyx/ui';
import { groupCatalog } from '../catalog/navigation';
import {
  type CatalogLayerFilter,
  type CatalogStatusFilter,
  updateCatalogRoute,
} from '../catalog/routing';
import type { UiCatalogEntry } from '../catalog/types';

const layerLabels = {
  foundations: 'Foundations',
  primitives: 'Primitives',
  components: 'Components',
  system: 'System',
} as const;

const layerOptions = [
  { value: 'all', label: 'All layers' },
  { value: 'foundations', label: 'Foundations' },
  { value: 'primitives', label: 'Primitives' },
  { value: 'components', label: 'Components' },
  { value: 'system', label: 'System' },
] as const;

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'candidate', label: 'Candidate' },
  { value: 'experimental', label: 'Experimental' },
  { value: 'deprecated', label: 'Deprecated' },
] as const;

function statusTone(status: UiCatalogEntry['status']) {
  if (status === 'accepted') return 'success' as const;
  if (status === 'deprecated') return 'danger' as const;
  if (status === 'experimental') return 'warning' as const;
  return 'neutral' as const;
}

export function StudioSidebar({
  entries,
  activeId,
  query,
  layer,
  status,
  onQueryChange,
  onLayerChange,
  onStatusChange,
}: {
  entries: readonly UiCatalogEntry[];
  activeId: string | undefined;
  query: string;
  layer: CatalogLayerFilter;
  status: CatalogStatusFilter;
  onQueryChange: (value: string) => void;
  onLayerChange: (value: CatalogLayerFilter) => void;
  onStatusChange: (value: CatalogStatusFilter) => void;
}) {
  const groups = groupCatalog(entries);
  return (
    <Surface className="ui-studio-sidebar" material="glass" radius="lg" elevation={1}>
      <Stack className="ui-studio-sidebar__header" gap="sm">
        <Stack gap="3xs">
          <Label tone="accent" emphasis="strong">
            OntologyX UI Studio
          </Label>
          <Text tone="tertiary">Generated · self-hosted · acceptance-bound</Text>
        </Stack>
        <SearchField
          value={query}
          onValueChange={onQueryChange}
          label="Search UI catalog"
          placeholder="Components, props, guidance…"
          hideLabel
        />
        <Box className="ui-studio-sidebar__filters" data-studio-catalog-filters>
          <Select
            label="Catalog layer"
            hideLabel
            fieldSize="sm"
            options={layerOptions}
            value={layer}
            onValueChange={(value) => onLayerChange(value as CatalogLayerFilter)}
          />
          <Select
            label="Lifecycle status"
            hideLabel
            fieldSize="sm"
            options={statusOptions}
            value={status}
            onValueChange={(value) => onStatusChange(value as CatalogStatusFilter)}
          />
        </Box>
      </Stack>

      <ScrollView className="ui-studio-sidebar__scroll" ariaLabel="Generated UI catalog navigation">
        <Stack className="ui-studio-sidebar__content" gap="lg">
          {groups.map((group) => (
            <Stack key={group.layer} gap="sm">
              <Row className="ui-studio-sidebar__layer-heading" justify="between" gap="sm">
                <Label emphasis="strong">{layerLabels[group.layer]}</Label>
                <Badge size="sm">{group.count}</Badge>
              </Row>
              {group.categories.map((category) => (
                <ListSection
                  key={category.id}
                  title={category.label}
                  description={`${category.entries.length} ${category.entries.length === 1 ? 'entry' : 'entries'}`}
                  className="ui-studio-sidebar__category"
                >
                  <List label={`${layerLabels[group.layer]} / ${category.label}`}>
                    {category.entries.map((entry) => (
                      <ListItem
                        key={entry.id}
                        primary={entry.exportName}
                        secondary={entry.summary}
                        metadata={
                          <Badge size="sm" tone={statusTone(entry.status)}>
                            {entry.status}
                          </Badge>
                        }
                        selected={entry.id === activeId}
                        selectionSemantics="current"
                        actionLabel={`Open ${entry.exportName}`}
                        onActivate={() =>
                          updateCatalogRoute({
                            entry: entry.id,
                            tab: 'overview',
                            example: null,
                            state: null,
                          })
                        }
                        className="ui-studio-sidebar__entry"
                      />
                    ))}
                  </List>
                </ListSection>
              ))}
            </Stack>
          ))}
          {!groups.length ? (
            <Text tone="tertiary">No catalog entries match these filters.</Text>
          ) : null}
        </Stack>
      </ScrollView>
    </Surface>
  );
}
