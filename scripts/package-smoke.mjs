import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const temp = await mkdtemp(path.join(os.tmpdir(), 'ontologyx-ui-package-smoke-'));
const manifest = JSON.parse(await readFile(path.join(root, 'packages/ui/package.json'), 'utf8'));
const tarballName = `${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${manifest.version}.tgz`;
const tarball = path.join(root, 'artifacts', tarballName);
const evidenceRoot = path.join(root, 'artifacts', 'package-smoke');
await mkdir(evidenceRoot, { recursive: true });

function run(args, cwd = root, { capture = false } = {}) {
  const result = spawnSync(pnpm, args, {
    cwd,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: capture ? 'utf8' : undefined,
  });
  if (result.status !== 0) {
    const detail = capture ? String(result.stderr || result.stdout || '').trim() : '';
    throw new Error(
      `pnpm ${args.join(' ')} failed with ${result.status}${detail ? `: ${detail}` : ''}`,
    );
  }
  return result;
}

function runNode(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`node ${args.join(' ')} failed with ${result.status}`);
}

async function filesUnder(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await filesUnder(target, files);
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

const evidence = {
  schema: 2,
  createdAt: new Date().toISOString(),
  package: `${manifest.name}@${manifest.version}`,
  tarball,
  status: 'failed',
  proofs: {
    install: false,
    nodeImports: false,
    ssrRender: false,
    types: false,
    viteBuild: false,
    explicitStyles: false,
    treeShaking: false,
    singleReactPeer: false,
  },
  consumerRoot: temp,
  error: null,
};

try {
  await stat(tarball).catch(() => {
    throw new Error(
      `Packed candidate is missing: ${tarball}. Run pnpm package:tarball or pnpm release:check first.`,
    );
  });

  const consumer = path.join(temp, 'consumer');
  await mkdir(path.join(consumer, 'src'), { recursive: true });
  await writeFile(
    path.join(consumer, 'package.json'),
    `${JSON.stringify(
      {
        name: 'ontologyx-ui-package-smoke',
        private: true,
        type: 'module',
        dependencies: {
          '@ontologyx/ui': `file:${tarball}`,
          react: '19.2.8',
          'react-dom': '19.2.8',
        },
        devDependencies: {
          '@types/react': '19.2.18',
          '@types/react-dom': '19.2.4',
          typescript: '7.0.2',
          vite: '8.2.1',
          '@vitejs/plugin-react': '6.0.5',
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(consumer, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          strict: true,
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          skipLibCheck: true,
          noEmit: true,
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(consumer, 'index.html'),
    '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n',
  );
  await writeFile(
    path.join(consumer, 'src/vite-env.d.ts'),
    '/// <reference types="vite/client" />\n',
  );
  await writeFile(
    path.join(consumer, 'src/main.tsx'),
    `import '@ontologyx/ui/styles.css';
import { Button, Icon, Stack, UiRoot, type SystemKeyboardSurfaceState } from '@ontologyx/ui';
import { HomeGlyph, PlaybackGlyph } from '@ontologyx/ui/icons';
import { usePress } from '@ontologyx/ui/advanced';

const state: SystemKeyboardSurfaceState = {
  surfaceId: 'smoke',
  sessionId: 'smoke',
  visible: true,
  language: 'en',
  layout: 'letters',
  contentPurpose: 'text',
  secure: false,
};
void state;
void usePress;

export const Smoke = () => (
  <UiRoot>
    <Stack>
      <Button>Smoke</Button>
      <Icon glyph={HomeGlyph} />
      <Icon glyph={PlaybackGlyph} state="pause" />
    </Stack>
  </UiRoot>
);
`,
  );

  run(['install', '--prefer-offline', '--ignore-scripts', '--strict-peer-dependencies'], consumer);
  evidence.proofs.install = true;

  runNode(
    [
      '--input-type=module',
      '--eval',
      "await import('@ontologyx/ui'); await import('@ontologyx/ui/advanced'); await import('@ontologyx/ui/icons');",
    ],
    consumer,
  );
  evidence.proofs.nodeImports = true;

  runNode(
    [
      '--input-type=module',
      '--eval',
      `const React = await import('react'); const { renderToString } = await import('react-dom/server'); const { Button, Stack } = await import('@ontologyx/ui'); const html = renderToString(React.createElement(Stack, null, React.createElement(Button, null, 'SSR smoke'))); if (!html.includes('SSR smoke')) throw new Error('SSR output missing expected content');`,
    ],
    consumer,
  );
  evidence.proofs.ssrRender = true;

  run(['exec', 'tsc', '--noEmit', '-p', 'tsconfig.json', '--pretty', 'false'], consumer);
  evidence.proofs.types = true;

  run(['exec', 'vite', 'build'], consumer);
  evidence.proofs.viteBuild = true;

  const builtFiles = await filesUnder(path.join(consumer, 'dist'));
  const builtCss = builtFiles.filter((file) => file.endsWith('.css'));
  if (builtCss.length === 0) {
    throw new Error('Explicit stylesheet proof failed: Vite consumer emitted no CSS asset');
  }
  evidence.proofs.explicitStyles = true;
  const builtJs = builtFiles.filter((file) => file.endsWith('.js'));
  const builtJsSource = (await Promise.all(builtJs.map((file) => readFile(file, 'utf8')))).join(
    '\n',
  );
  for (const forbiddenMarker of [
    'data-oxs-system-keyboard',
    'ui-system-keyboard__alternates',
    'data-oxs-drag-drop-runtime',
  ]) {
    if (builtJsSource.includes(forbiddenMarker)) {
      throw new Error(
        `Tree-shaking proof failed: minimal consumer bundle retained unused marker ${forbiddenMarker}`,
      );
    }
  }
  evidence.proofs.treeShaking = true;

  const list = run(['list', 'react', 'react-dom', '--depth', '20', '--json'], consumer, {
    capture: true,
  });
  const listed = JSON.parse(list.stdout || '[]');
  const versions = { react: new Set(), 'react-dom': new Set() };
  const walk = (node) => {
    for (const [name, dependency] of Object.entries(node?.dependencies ?? {})) {
      if ((name === 'react' || name === 'react-dom') && dependency?.version) {
        versions[name].add(dependency.version);
      }
      walk(dependency);
    }
    for (const [name, dependency] of Object.entries(node?.devDependencies ?? {})) {
      if ((name === 'react' || name === 'react-dom') && dependency?.version) {
        versions[name].add(dependency.version);
      }
      walk(dependency);
    }
  };
  for (const node of listed) walk(node);
  if (
    versions.react.size !== 1 ||
    versions['react-dom'].size !== 1 ||
    !versions.react.has(manifest.peerDependencies.react) ||
    !versions['react-dom'].has(manifest.peerDependencies['react-dom'])
  ) {
    throw new Error(
      `React peer proof failed: react=${[...versions.react].join(',') || 'unknown'} react-dom=${[...versions['react-dom']].join(',') || 'unknown'}`,
    );
  }
  evidence.proofs.singleReactPeer = true;

  evidence.status = 'passed';
  console.log(
    `Published-tarball consumer smoke passed for ${manifest.name}@${manifest.version}: install · Node/SSR import · types · explicit styles · Vite build · tree-shaking · single React peer graph.`,
  );
} catch (error) {
  evidence.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(evidence.error);
} finally {
  const timestamp = evidence.createdAt.replaceAll(/[:.]/g, '-');
  const versioned = path.join(evidenceRoot, `package-smoke-${timestamp}.json`);
  await writeFile(versioned, `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(path.join(evidenceRoot, 'latest.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  if (evidence.status === 'passed') await rm(temp, { recursive: true, force: true });
  else console.error(`Failing package-smoke consumer preserved at ${temp}`);
}

if (evidence.status !== 'passed') process.exit(1);
