import { CatalogPage } from '../catalog/CatalogPage';
import { StudioEnvironmentProvider } from './StudioEnvironment';

export function UiKitStudio() {
  return (
    <StudioEnvironmentProvider>
      <CatalogPage />
    </StudioEnvironmentProvider>
  );
}
