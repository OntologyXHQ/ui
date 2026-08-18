import React from 'react';
import ReactDOM from 'react-dom/client';
import { CatalogErrorBoundary } from './catalog/CatalogErrorBoundary';
import { UiKitStudio } from './studio/UiKitStudio';
import '@ontologyx/ui/styles.css';
import './styles/studio.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('OntologyX UI Studio root element was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <CatalogErrorBoundary label="UI Studio">
      <UiKitStudio />
    </CatalogErrorBoundary>
  </React.StrictMode>,
);
