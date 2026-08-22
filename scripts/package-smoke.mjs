import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const temp = await mkdtemp(path.join(os.tmpdir(), 'ontologyx-ui-package-smoke-'));
const manifest = JSON.parse(await readFile(path.join(root, 'packages/ui/package.json'), 'utf8'));
const tarballName = `${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${manifest.version}.tgz`;
const tarball = path.join(root, 'artifacts', tarballName);

function run(args, cwd = root) {
  const result = spawnSync(pnpm, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`pnpm ${args.join(' ')} failed with ${result.status}`);
}

function runNode(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`node ${args.join(' ')} failed with ${result.status}`);
}

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
  runNode(
    [
      '--input-type=module',
      '--eval',
      "await import('@ontologyx/ui'); await import('@ontologyx/ui/advanced'); await import('@ontologyx/ui/icons');",
    ],
    consumer,
  );
  run(['exec', 'tsc', '--noEmit', '-p', 'tsconfig.json', '--pretty', 'false'], consumer);
  run(['exec', 'vite', 'build'], consumer);
  console.log(
    `Published-tarball consumer smoke passed for ${manifest.name}@${manifest.version}: install · Node import · types · explicit styles · Vite build.`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
