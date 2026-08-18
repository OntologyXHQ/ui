import {
  ActionGroup,
  AdaptiveNavigation,
  AppBar,
  Badge,
  Button,
  EmptyState,
  Grid,
  Heading,
  Icon,
  IconButton,
  Label,
  List,
  ListItem,
  ListSection,
  Progress,
  Row,
  ScrollView,
  Skeleton,
  Spinner,
  Stack,
  StatusIndicator,
  Surface,
  Tabs,
  Text,
  Toolbar,
  UiRoot,
  Wrap,
} from '@ontologyx/ui';
import { useState } from 'react';
import { StudioNav } from './StudioNav';

const navigationItems = [
  { value: 'home', label: 'Home', icon: <Icon name="apps" /> },
  { value: 'search', label: 'Search', icon: <Icon name="search" />, badge: <Badge size="sm" tone="accent">3</Badge> },
  { value: 'settings', label: 'Settings', icon: <Icon name="settings" /> },
] as const;

export function DataNavigationPage() {
  const [tab, setTab] = useState('recent');
  const [destination, setDestination] = useState('home');
  const [selectedRow, setSelectedRow] = useState('downloads');

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OntologyX UI data and navigation Components">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="data" />

            <section className="ui-studio-hero ui-data-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP08</Label>
                  <Label tone="tertiary">Components · data + navigation</Label>
                </Row>
                <Heading level={1} size="display">Information moves. The component contract stays generic.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Lists, tabs, adaptive navigation, toolbars and feedback now share the same developer-facing layer.
                  Container space chooses presentation; product and OXS system semantics stay above this package.
                </Text>
              </Stack>
            </section>

            <Grid min="wide" gap="lg">
              <Surface material="glass" elevation={1} radius="xl" className="ui-data-card">
                <ListSection title="Recent locations" description="Static and actionable rows share one data language." trailing={<Badge tone="accent">4</Badge>}>
                  <List label="Recent locations" divided>
                    <ListItem primary="Desktop" secondary="12 items" leading={<Icon name="apps" />} metadata="Now" />
                    <ListItem primary="Downloads" secondary="Last opened 2m ago" selected={selectedRow === 'downloads'} onActivate={() => setSelectedRow('downloads')} trailing={<StatusIndicator label="Synced" tone="success" showLabel={false} />} />
                    <ListItem primary="Projects" secondary="8 repositories" onActivate={() => setSelectedRow('projects')} trailing={<Badge>8</Badge>} />
                    <ListItem primary="Archive" secondary="Read only" disabled onActivate={() => setSelectedRow('archive')} />
                  </List>
                </ListSection>
              </Surface>

              <Surface material="glass" elevation={1} radius="xl" className="ui-data-card">
                <Stack gap="md">
                  <Tabs
                    label="Data views"
                    value={tab}
                    onValueChange={setTab}
                    items={[
                      { value: 'recent', label: 'Recent', badge: <Badge size="sm">12</Badge> },
                      { value: 'shared', label: 'Shared' },
                      { value: 'offline', label: 'Offline' },
                    ]}
                  />
                  <Text tone="secondary">Selected tab: {tab}</Text>
                  <AdaptiveNavigation label="Example application" items={navigationItems} value={destination} onValueChange={setDestination} />
                </Stack>
              </Surface>
            </Grid>

            <Surface material="subtle" radius="xl" className="ui-data-card">
              <Stack gap="md">
                <AppBar
                  title="Workspace"
                  subtitle="Generic app-bar composition"
                  leading={<IconButton icon="chevron-start" label="Back" size="sm" />}
                  actions={
                    <Toolbar label="Workspace actions" overflow={<IconButton icon="settings" label="More actions" size="sm" />}>
                      <ActionGroup label="Primary actions"><Button size="sm" variant="filled">New</Button><Button size="sm">Share</Button></ActionGroup>
                      <ActionGroup label="Secondary actions" collapse="compact"><Button size="sm">Sort</Button><Button size="sm">Filter</Button></ActionGroup>
                    </Toolbar>
                  }
                />
              </Stack>
            </Surface>

            <Grid min="wide" gap="lg">
              <Surface material="glass" radius="xl" className="ui-data-card">
                <Stack gap="md">
                  <Label tone="accent" emphasis="strong">Feedback vocabulary</Label>
                  <Wrap gap="sm">
                    <Badge tone="accent">12</Badge>
                    <Badge tone="success">Ready</Badge>
                    <StatusIndicator tone="success" label="Connected" />
                    <StatusIndicator tone="warning" label="Degraded" />
                    <Spinner label="Refreshing data" />
                  </Wrap>
                  <Progress label="Sync progress" value={68} showValue />
                  <Stack gap="xs"><Skeleton width="medium" /><Skeleton /><Skeleton width="short" /></Stack>
                </Stack>
              </Surface>

              <Surface material="glass" radius="xl" className="ui-data-card">
                <EmptyState
                  icon={<Icon name="search" size="lg" />}
                  title="No matching items"
                  description="The empty-state component owns composition, not product-specific recovery logic."
                  action={<Button size="sm">Clear filters</Button>}
                />
              </Surface>
            </Grid>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Adaptive acceptance</Label>
                  <Heading level={2} size="title">Same navigation API, different available space</Heading>
                  <Text tone="secondary" wrap="pretty">Auto navigation changes presentation from its container instead of guessing device type.</Text>
                </Stack>
                <Grid min="wide" gap="md">
                  <NavigationMatrix direction="ltr" />
                  <NavigationMatrix direction="rtl" />
                </Grid>
              </Stack>
            </section>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}

function NavigationMatrix({ direction }: { direction: 'ltr' | 'rtl' }) {
  const [value, setValue] = useState('home');
  return (
    <UiRoot scope="nested" direction={direction} modality="touch" pointerPrecision="coarse">
      <Surface material="glass" radius="xl" className="ui-data-card ui-data-card--matrix">
        <Stack gap="md">
          <Row justify="between" gap="sm"><Label tone="accent" emphasis="strong">{direction.toUpperCase()}</Label><Label tone="tertiary">coarse pointer</Label></Row>
          <AdaptiveNavigation label={`${direction} navigation`} items={navigationItems} value={value} onValueChange={setValue} />
          <List label={`${direction} list`}><ListItem primary={direction === 'rtl' ? 'فایل‌ها' : 'Files'} secondary={direction === 'rtl' ? '۱۲ مورد' : '12 items'} leading={<Icon name="apps" />} trailing={<Badge tone="accent">12</Badge>} /></List>
        </Stack>
      </Surface>
    </UiRoot>
  );
}
