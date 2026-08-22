import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const require = createRequire(import.meta.url);
const ts = require('@typescript/typescript6');

const STATIC_FIELDS = [
  'exportName',
  'layer',
  'category',
  'summary',
  'usage',
  'status',
  'accessibility',
  'rtl',
  'touch',
  'responsive',
];

function walkFiles(root, predicate) {
  const out = [];
  const visit = (dir) => {
    for (const entry of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'test') continue;
        visit(full);
      } else if (predicate(full)) {
        out.push(full);
      }
    }
  };
  visit(root);
  return out;
}

function collectStaticBindings(source) {
  const bindings = new Map();
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    if (!(node.declarationList.flags & ts.NodeFlags.Const)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      bindings.set(declaration.name.text, declaration.initializer);
    }
  });
  return bindings;
}

function literalValue(node, bindings, resolving = new Set()) {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    return literalValue(node.expression, bindings, resolving);
  if (ts.isIdentifier(node)) {
    const initializer = bindings.get(node.text);
    if (!initializer) {
      throw new Error(
        `UI docs metadata identifier must resolve to a local static const: ${node.text} in ${node.getSourceFile().fileName}`,
      );
    }
    if (resolving.has(node.text)) {
      throw new Error(
        `UI docs metadata contains a cyclic static const reference: ${node.text} in ${node.getSourceFile().fileName}`,
      );
    }
    const nextResolving = new Set(resolving);
    nextResolving.add(node.text);
    return literalValue(initializer, bindings, nextResolving);
  }
  if (ts.isStringLiteralLike(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((element) => literalValue(element, bindings, resolving));
  if (ts.isObjectLiteralExpression(node)) {
    const obj = {};
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop)) {
        const spread = literalValue(prop.expression, bindings, resolving);
        if (!spread || Array.isArray(spread) || typeof spread !== 'object') {
          throw new Error(
            `UI docs metadata spread must resolve to a static object: ${node.getSourceFile().fileName}`,
          );
        }
        Object.assign(obj, spread);
        continue;
      }
      if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
        throw new Error(
          `UI docs metadata only supports static named properties and local static object spreads: ${node.getSourceFile().fileName}`,
        );
      }
      obj[prop.name.text] = literalValue(prop.initializer, bindings, resolving);
    }
    return obj;
  }
  throw new Error(`UI docs metadata must be static literals: ${node.getSourceFile().fileName}`);
}

function parseDocsFile(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const docs = [];
  const bindings = collectStaticBindings(source);
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) continue;
      const callee = declaration.initializer.expression;
      if (!ts.isIdentifier(callee)) continue;
      if (callee.text !== 'defineUiDocs' && callee.text !== 'defineUiDocsGroup') continue;
      const first = declaration.initializer.arguments[0];
      if (!first) throw new Error(`Missing docs metadata in ${file}`);
      const value = literalValue(first, bindings);
      if (callee.text === 'defineUiDocsGroup') {
        if (!Array.isArray(value))
          throw new Error(`defineUiDocsGroup must receive an array in ${file}`);
        docs.push(...value);
      } else {
        docs.push(value);
      }
    }
  });
  if (docs.length === 0) throw new Error(`No defineUiDocs metadata found in ${file}`);
  for (const doc of docs) {
    for (const field of STATIC_FIELDS) {
      if (typeof doc[field] !== 'string' || doc[field].trim() === '') {
        throw new Error(
          `${path.basename(file)}: ${doc.exportName ?? '<unknown>'} is missing ${field}`,
        );
      }
    }
    if (typeof doc.order !== 'number' || !Number.isFinite(doc.order)) {
      throw new Error(
        `${path.basename(file)}: ${doc.exportName ?? '<unknown>'} is missing numeric order`,
      );
    }
    doc.examples ??= [];
    doc.__file = file;
  }
  return docs;
}

function createProgram(uiRoot) {
  const srcRoot = path.join(uiRoot, 'src');
  const files = walkFiles(
    srcRoot,
    (file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('.docs.tsx'),
  );
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    noEmit: true,
    allowJs: false,
  };
  return ts.createProgram(files, options);
}

function getPublicExports(program, indexFile) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(indexFile);
  if (!source) throw new Error(`Unable to load public UI entry: ${indexFile}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`Unable to resolve public UI module symbol: ${indexFile}`);
  const exports = new Map();
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const declarations = target.getDeclarations() ?? symbol.getDeclarations() ?? [];
    exports.set(symbol.getName(), { symbol: target, declarations });
  }
  return { checker, exports };
}

function isVisualPublicExport(name, record, srcRoot) {
  if (!/^[A-Z]/.test(name)) return false;
  if (!(record.symbol.flags & ts.SymbolFlags.Value)) return false;
  return record.declarations.some((decl) => {
    const file = path.resolve(decl.getSourceFile().fileName);
    return file.startsWith(path.resolve(srcRoot) + path.sep) && file.endsWith('.tsx');
  });
}

function safeDefaultMap(declarations, exportName) {
  const defaults = new Map();
  const recordBinding = (parameter) => {
    if (!ts.isObjectBindingPattern(parameter.name)) return;
    for (const element of parameter.name.elements) {
      if (!ts.isIdentifier(element.name) || !element.initializer) continue;
      const value = element.initializer;
      if (
        ts.isStringLiteralLike(value) ||
        ts.isNumericLiteral(value) ||
        value.kind === ts.SyntaxKind.TrueKeyword ||
        value.kind === ts.SyntaxKind.FalseKeyword
      ) {
        defaults.set(element.name.text, value.getText());
      }
    }
  };
  for (const declaration of declarations) {
    const source = declaration.getSourceFile();
    const visit = (node) => {
      if (ts.isFunctionLike(node) && node.parameters.length > 0) {
        const name = node.name && ts.isIdentifier(node.name) ? node.name.text : '';
        if (name === exportName || name === `${exportName}Impl`) recordBinding(node.parameters[0]);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return defaults;
}

function findNamedType(program, name, srcRoot) {
  for (const source of program.getSourceFiles()) {
    const file = path.resolve(source.fileName);
    if (!file.startsWith(path.resolve(srcRoot) + path.sep)) continue;
    let found = null;
    const visit = (node) => {
      if (found) return;
      if (
        (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
        node.name.text === name
      ) {
        found = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    if (found) return found;
  }
  return null;
}

function componentTypeNode(record) {
  const inspectVariable = (declaration, visited = new Set()) => {
    if (!declaration || visited.has(declaration)) return null;
    visited.add(declaration);
    const initializer = declaration.initializer;
    if (!initializer) return null;
    if (ts.isCallExpression(initializer)) {
      const callee = initializer.expression;
      if (ts.isIdentifier(callee) && callee.text === 'forwardRef') {
        if (initializer.typeArguments?.length >= 2) return initializer.typeArguments[1];
        const render = initializer.arguments[0];
        if (
          (ts.isFunctionExpression(render) || ts.isArrowFunction(render)) &&
          render.parameters[0]?.type
        )
          return render.parameters[0].type;
      }
    }
    if (ts.isIdentifier(initializer)) {
      const source = declaration.getSourceFile();
      let target = null;
      const visit = (node) => {
        if (target) return;
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === initializer.text
        )
          target = node;
        ts.forEachChild(node, visit);
      };
      visit(source);
      return inspectVariable(target, visited);
    }
    return null;
  };

  for (const declaration of record.declarations) {
    if (ts.isFunctionDeclaration(declaration) && declaration.parameters[0]?.type)
      return declaration.parameters[0].type;
    if (ts.isVariableDeclaration(declaration)) {
      const node = inspectVariable(declaration);
      if (node) return node;
    }
  }
  return null;
}

function propsForExport(program, record, exportName, srcRoot) {
  const rootType = componentTypeNode(record);
  if (!rootType) return [];
  const defaults = safeDefaultMap(record.declarations, exportName);
  const collected = new Map();
  const visitedTypes = new Set();

  const collect = (node) => {
    if (!node) return;
    if (ts.isParenthesizedTypeNode(node)) return collect(node.type);
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      for (const child of node.types) collect(child);
      return;
    }
    if (ts.isTypeLiteralNode(node)) {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;
        const name =
          ts.isIdentifier(member.name) || ts.isStringLiteralLike(member.name)
            ? member.name.text
            : member.name.getText();
        const tags = ts.getJSDocTags(member);
        const defaultTag = tags.find(
          (tag) => tag.tagName.text === 'default' || tag.tagName.text === 'defaultValue',
        );
        const description = ts
          .getJSDocCommentsAndTags(member)
          .filter(ts.isJSDoc)
          .map((doc) => (typeof doc.comment === 'string' ? doc.comment : ''))
          .filter(Boolean)
          .join(' ');
        collected.set(name, {
          name,
          type: member.type ? member.type.getText(member.getSourceFile()) : 'unknown',
          optional: Boolean(member.questionToken),
          description,
          deprecated: tags.some((tag) => tag.tagName.text === 'deprecated'),
          default: defaultTag?.comment ? String(defaultTag.comment) : (defaults.get(name) ?? null),
        });
      }
      return;
    }
    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText(node.getSourceFile());
      if (
        (name === 'PropsWithChildren' ||
          name === 'Omit' ||
          name === 'Pick' ||
          name === 'Readonly') &&
        node.typeArguments?.[0]
      ) {
        collect(node.typeArguments[0]);
        return;
      }
      if (visitedTypes.has(name)) return;
      visitedTypes.add(name);
      const declaration = findNamedType(program, name, srcRoot);
      if (declaration) {
        if (ts.isTypeAliasDeclaration(declaration)) collect(declaration.type);
        else {
          for (const member of declaration.members) {
            if (ts.isPropertySignature(member)) collect(ts.factory.createTypeLiteralNode([member]));
          }
          for (const clause of declaration.heritageClauses ?? []) {
            for (const type of clause.types) collect(type);
          }
        }
      }
      return;
    }
  };

  collect(rootType);
  return [...collected.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function stateModelsForProps(props) {
  const names = new Set(props.map((prop) => prop.name));
  const candidates = [
    ['value', 'onValueChange', 'defaultValue'],
    ['checked', 'onCheckedChange', 'defaultChecked'],
    ['pressed', 'onPressedChange', 'defaultPressed'],
    ['selected', 'onSelectedChange', 'defaultSelected'],
    ['open', 'onOpenChange', 'defaultOpen'],
    ['query', 'onQueryChange', 'defaultQuery'],
  ];
  return candidates
    .filter(([valueProp, changeProp]) => names.has(valueProp) && names.has(changeProp))
    .map(([valueProp, changeProp, defaultProp]) => ({
      valueProp,
      changeProp,
      defaultProp: names.has(defaultProp) ? defaultProp : null,
      mode: names.has(defaultProp) ? 'controlled-uncontrolled' : 'controlled',
    }));
}

function moduleAliasForDocs(file, srcRoot) {
  const relative = path
    .relative(srcRoot, file)
    .replaceAll(path.sep, '/')
    .replace(/\.tsx$/, '');
  return `@ontologyx/ui-docs/${relative}`;
}

function isNonSdkDocsFile(file, srcRoot) {
  const relative = path.relative(srcRoot, file).replaceAll(path.sep, '/');
  const owner = relative.split('/')[0];
  return (
    ['cursor', 'drag-drop', 'motion', 'patterns'].includes(owner) ||
    relative === 'components/AppTile.docs.tsx'
  );
}

export function buildCatalog({ uiRoot }) {
  const srcRoot = path.join(uiRoot, 'src');
  const indexFile = path.join(srcRoot, 'index.ts');
  const program = createProgram(uiRoot);
  const { exports } = getPublicExports(program, indexFile);
  const visualExports = [...exports.entries()]
    .filter(([name, record]) => isVisualPublicExport(name, record, srcRoot))
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));

  const docsFiles = walkFiles(srcRoot, (file) => file.endsWith('.docs.tsx'));
  const docs = docsFiles.flatMap(parseDocsFile);
  const byExport = new Map();
  for (const doc of docs) {
    if (!exports.has(doc.exportName)) {
      if (isNonSdkDocsFile(doc.__file, srcRoot)) continue;
      throw new Error(`UI docs reference non-public export ${doc.exportName}`);
    }
    if (byExport.has(doc.exportName)) throw new Error(`Duplicate UI docs for ${doc.exportName}`);
    byExport.set(doc.exportName, doc);
  }

  const missing = visualExports.filter((name) => !byExport.has(name));
  if (missing.length > 0) {
    throw new Error(`Public visual exports missing colocated docs: ${missing.join(', ')}`);
  }

  return visualExports.map((exportName) => {
    const doc = byExport.get(exportName);
    const record = exports.get(exportName);
    const props = propsForExport(program, record, exportName, srcRoot);
    return {
      id: exportName,
      exportName,
      layer: doc.layer,
      category: doc.category,
      order: doc.order,
      summary: doc.summary,
      usage: doc.usage,
      status: doc.status,
      accessibility: doc.accessibility,
      rtl: doc.rtl,
      touch: doc.touch,
      responsive: doc.responsive,
      playground: doc.playground ?? null,
      preview: doc.preview ?? null,
      stateModels: stateModelsForProps(props),
      props,
      examples: (doc.examples ?? []).map((example) => ({ ...example })),
      docsModule: moduleAliasForDocs(doc.__file, srcRoot),
    };
  });
}

export function renderJson(catalog) {
  return `${JSON.stringify(
    catalog.map(({ docsModule, ...entry }) => entry),
    null,
    2,
  )}\n`;
}

export function renderTypeScript(catalog) {
  const lines = [
    '// biome-ignore-all format: generated deterministically; freshness is enforced by docs:check',
    "import type { UiCatalogEntry } from '../types';",
    '',
    '// Generated by packages/ui/scripts/generate-catalog.mjs. Do not edit by hand.',
    'export const uiCatalog: readonly UiCatalogEntry[] = [',
  ];
  for (const entry of catalog) {
    lines.push('  {');
    for (const key of [
      'id',
      'exportName',
      'layer',
      'category',
      'order',
      'summary',
      'usage',
      'status',
      'accessibility',
      'rtl',
      'touch',
      'responsive',
    ]) {
      lines.push(`    ${key}: ${JSON.stringify(entry[key])},`);
    }
    lines.push(`    playground: ${JSON.stringify(entry.playground)},`);
    lines.push(`    certification: ${JSON.stringify(entry.certification ?? null)},`);
    lines.push(`    stateModels: ${JSON.stringify(entry.stateModels)},`);
    if (entry.preview) {
      const previewAccess = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(entry.preview.component)
        ? `module.${entry.preview.component}`
        : `module[${JSON.stringify(entry.preview.component)}]`;
      lines.push('    preview: {');
      lines.push(`      component: ${JSON.stringify(entry.preview.component)},`);
      lines.push(
        `      load: () => import(${JSON.stringify(entry.docsModule)}).then((module) => ({ default: ${previewAccess} })),`,
      );
      lines.push('    },');
    } else {
      lines.push('    preview: null,');
    }
    lines.push(`    props: ${JSON.stringify(entry.props)},`);
    lines.push('    examples: [');
    for (const example of entry.examples) {
      lines.push('      {');
      lines.push(`        id: ${JSON.stringify(example.id)},`);
      lines.push(`        title: ${JSON.stringify(example.title)},`);
      lines.push(`        description: ${JSON.stringify(example.description ?? '')},`);
      const componentAccess = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(example.component)
        ? `module.${example.component}`
        : `module[${JSON.stringify(example.component)}]`;
      lines.push(
        `        load: () => import(${JSON.stringify(entry.docsModule)}).then((module) => ({ default: ${componentAccess} })),`,
      );
      lines.push('      },');
    }
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('] as const;', '');
  return lines.join('\n');
}

export function writeCatalog({
  uiRoot,
  studioRoot,
  check = false,
  certificationsPath = path.resolve(uiRoot, '..', '..', 'docs', 'quality', 'CERTIFICATIONS.json'),
}) {
  const builtCatalog = buildCatalog({ uiRoot });
  if (!fs.existsSync(certificationsPath)) {
    throw new Error(
      `UI certification manifest not found: ${certificationsPath}. Pass certificationsPath for isolated catalog fixtures or consumer workspaces.`,
    );
  }
  const certificationDocument = JSON.parse(fs.readFileSync(certificationsPath, 'utf8'));
  const certificationExports = certificationDocument?.exports ?? {};
  const catalog = builtCatalog.map((entry) => {
    const certification = certificationExports[entry.exportName];
    return {
      ...entry,
      certification: certification
        ? {
            ...certification,
            behaviorTests: certification.behaviorTests.map((testPath) =>
              testPath.startsWith('packages/ui/src/')
                ? `@ontologyx/ui/${testPath.slice('packages/ui/src/'.length)}`
                : testPath,
            ),
            behaviorSources: [...certification.behaviorTests],
            browserSource: 'scripts/browser/scenarios.mjs',
            result: 'certified',
          }
        : null,
    };
  });
  const generatedRoot = path.join(studioRoot, 'src', 'catalog', 'generated');
  const jsonPath = path.join(generatedRoot, 'catalog.generated.json');
  const tsPath = path.join(generatedRoot, 'catalog.generated.ts');
  const expected = new Map([
    [jsonPath, renderJson(catalog)],
    [tsPath, renderTypeScript(catalog)],
  ]);
  if (check) {
    const stale = [];
    for (const [file, content] of expected) {
      if (!fs.existsSync(file)) {
        stale.push(file);
        continue;
      }
      const actual = fs.readFileSync(file, 'utf8');
      if (file === jsonPath) {
        try {
          if (!isDeepStrictEqual(JSON.parse(actual), JSON.parse(content))) stale.push(file);
        } catch {
          stale.push(file);
        }
        continue;
      }
      if (actual !== content) stale.push(file);
    }
    if (stale.length > 0) {
      throw new Error(
        `Generated UI catalog is stale. Run pnpm --filter @ontologyx/ui docs:generate\n${stale.join('\n')}`,
      );
    }
  } else {
    fs.mkdirSync(generatedRoot, { recursive: true });
    for (const [file, content] of expected) fs.writeFileSync(file, content);
  }
  return catalog;
}
