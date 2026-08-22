import { Label, Stack, Surface, Text } from '@ontologyx/ui';
import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Component } from 'react';

type State = { error: Error | null };

type CatalogErrorBoundaryProps = PropsWithChildren<{
  label: string;
  resetKey?: string;
}>;

export class CatalogErrorBoundary extends Component<CatalogErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: CatalogErrorBoundaryProps) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`OntologyX UI Studio isolated failure: ${this.props.label}`, error, info);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <Surface className="ui-catalog-error" material="subtle" radius="md">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">
            Isolated example failure
          </Label>
          <Text tone="secondary">
            {this.props.label} failed without taking down the rest of the Studio.
          </Text>
          <Text variant="caption" tone="tertiary" selectable>
            {this.state.error.message}
          </Text>
        </Stack>
      </Surface>
    );
  }
}
