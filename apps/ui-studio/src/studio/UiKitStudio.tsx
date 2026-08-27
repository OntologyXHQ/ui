import { useEffect, useState } from 'react';
import { CatalogPage } from '../catalog/CatalogPage';
import { readStudioView } from '../catalog/routing';
import { SemanticWorkbench } from './SemanticWorkbench';
import { StudioEnvironmentProvider } from './StudioEnvironment';

export function UiKitStudio() {
  const [, forceLocation] = useState(0);
  useEffect(() => {
    const onPopState = () => forceLocation((value) => value + 1);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <StudioEnvironmentProvider>
      {readStudioView() === 'semantic' ? <SemanticWorkbench /> : <CatalogPage />}
    </StudioEnvironmentProvider>
  );
}
