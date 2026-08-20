import { readFileSync } from 'node:fs';

const stylesRoot = new URL('../src/styles/', import.meta.url);
const readStyle = (name) => readFileSync(new URL(name, stylesRoot), 'utf8');
const indexCss = readStyle('index.css');
const importedStyleNames = [
  ...indexCss.matchAll(/@import\s+[\'"]\.\/([^\'"]+\.css)[\'"]\s*;/g),
].map((match) => match[1]);

if (!importedStyleNames.length) {
  throw new Error(
    'OntologyX UI host-safety failed: production style index has no local CSS imports to inspect.',
  );
}
if (new Set(importedStyleNames).size !== importedStyleNames.length) {
  throw new Error(
    'OntologyX UI host-safety failed: production style index contains duplicate CSS imports.',
  );
}

const importedStyles = new Map(importedStyleNames.map((name) => [name, readStyle(name)]));
const productionCss = [...importedStyles.values()].join('\n');
const componentsCss = importedStyles.get('components.css');

const documentOwnerPattern = /(^|[,{\n]\s*)(?:html|body|#root|:root)(?:\s|,|\{|$)/m;
if (documentOwnerPattern.test(productionCss)) {
  throw new Error(
    'OntologyX UI host-safety failed: production UI CSS claims html/body/#root/:root ownership.',
  );
}

if (!componentsCss) {
  throw new Error(
    'OntologyX UI host-safety failed: production style index no longer includes components.css.',
  );
}
if (!componentsCss.includes('container-name: oxs-navigation')) {
  throw new Error(
    'OntologyX UI host-safety failed: AdaptiveNavigation is missing its local oxs-navigation container.',
  );
}
if (!componentsCss.includes('@container oxs-navigation')) {
  throw new Error(
    'OntologyX UI host-safety failed: AdaptiveNavigation queries are not scoped to oxs-navigation.',
  );
}

console.log(
  `OntologyX UI host-safety CSS check passed (${importedStyleNames.length} production styles scanned).`,
);
