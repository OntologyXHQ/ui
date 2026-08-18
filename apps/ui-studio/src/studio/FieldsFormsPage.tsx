import {
  Button,
  FieldGroup,
  FieldSection,
  Grid,
  Heading,
  Label,
  Row,
  ScrollView,
  SearchField,
  Select,
  Stack,
  Surface,
  Text,
  TextArea,
  TextField,
  UiRoot,
} from '@oxs/ui';
import { useState } from 'react';
import { StudioNav } from './StudioNav';

const densityOptions = [
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing for general use.' },
  { value: 'compact', label: 'Compact', description: 'Denser information layout.' },
  { value: 'spacious', label: 'Spacious', description: 'More room for touch-first layouts.' },
] as const;

export function FieldsFormsPage() {
  const [search, setSearch] = useState('Launcher');
  const [density, setDensity] = useState('comfortable');
  const [notes, setNotes] = useState('The same field frame owns labels, help, errors and actions.');
  const [suggestionRequests, setSuggestionRequests] = useState(0);

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS UI fields and forms Components">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="fields" />

            <section className="ui-studio-hero ui-fields-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP07</Label>
                  <Label tone="tertiary">Components · fields + forms</Label>
                </Row>
                <Heading level={1} size="display">One field language, one editing path.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Labels, descriptions, errors, affixes, actions, multiline editing and bounded choice now share one
                  developer-facing contract. Popup geometry and text sessions reuse the platform runtimes instead of
                  growing feature-local engines.
                </Text>
              </Stack>
            </section>

            <Grid min="wide" gap="lg">
              <Surface material="glass" elevation={1} radius="xl" className="ui-fields-card">
                <FieldSection title="Identity" description="Shared field chrome and accessible relationships.">
                  <FieldGroup label="Account details" description="Required, optional and invalid states.">
                    <TextField
                      label="Display name"
                      defaultValue="OXS"
                      description="Shown in local system surfaces."
                      required
                    />
                    <TextField label="Handle" prefix="@" suffix=".local" placeholder="workspace" />
                    <TextField
                      label="Recovery code"
                      defaultValue="expired-code"
                      error="This code has expired."
                      supportingAction={<Button size="sm" variant="ghost">Request new</Button>}
                    />
                    <TextField label="Managed value" defaultValue="Policy controlled" readOnly />
                  </FieldGroup>
                </FieldSection>
              </Surface>

              <Surface material="glass" elevation={1} radius="xl" className="ui-fields-card">
                <FieldSection title="Search + choice" description="Search requests suggestions; Select owns only bounded choice.">
                  <SearchField
                    label="Applications"
                    value={search}
                    onValueChange={setSearch}
                    suggestionsAvailable
                    onSuggestionsRequest={() => setSuggestionRequests((value) => value + 1)}
                    description={`Suggestion requests: ${suggestionRequests}`}
                  />
                  <Select
                    label="Density"
                    options={densityOptions}
                    value={density}
                    onValueChange={setDensity}
                    description="Uses shared floating, overlay and keyboard-focus services."
                  />
                </FieldSection>
              </Surface>
            </Grid>

            <Surface material="subtle" radius="xl" className="ui-fields-card">
              <FieldSection title="Multiline editing" description="The textarea publishes the same native editing session contract.">
                <TextArea
                  label="Notes"
                  value={notes}
                  onChange={(event) => setNotes(event.currentTarget.value)}
                  maxLength={180}
                  showCharacterCount
                  rows={6}
                  resize="block"
                />
              </FieldSection>
            </Surface>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Acceptance matrix</Label>
                  <Heading level={2} size="title">Narrow + touch + RTL now, not later</Heading>
                  <Text tone="secondary" wrap="pretty">
                    Field chrome and text bidi direction are separate: container flow can be RTL while user-entered content remains auto-directed.
                  </Text>
                </Stack>
                <Grid min="wide" gap="md">
                  <DirectionFields direction="ltr" />
                  <DirectionFields direction="rtl" />
                </Grid>
              </Stack>
            </section>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}

function DirectionFields({ direction }: { direction: 'ltr' | 'rtl' }) {
  const [value, setValue] = useState(direction === 'rtl' ? 'جستجو' : 'Search');
  const [choice, setChoice] = useState('comfortable');

  return (
    <UiRoot scope="nested" direction={direction} modality="touch" pointerPrecision="coarse">
      <Surface material="glass" radius="xl" className="ui-fields-card ui-fields-card--matrix">
        <Stack gap="md">
          <Row justify="between" gap="sm">
            <Label tone="accent" emphasis="strong">{direction.toUpperCase()}</Label>
            <Label tone="tertiary">coarse pointer</Label>
          </Row>
          <SearchField
            label={direction === 'rtl' ? 'جستجو' : 'Search'}
            value={value}
            onValueChange={setValue}
            textDirection="auto"
          />
          <Select
            label={direction === 'rtl' ? 'تراکم' : 'Density'}
            value={choice}
            onValueChange={setChoice}
            options={densityOptions}
          />
          <TextArea
            label={direction === 'rtl' ? 'یادداشت' : 'Notes'}
            defaultValue={direction === 'rtl' ? 'متن فارسی و English کنار هم' : 'English and فارسی can coexist'}
            textDirection="auto"
            rows={4}
          />
        </Stack>
      </Surface>
    </UiRoot>
  );
}
