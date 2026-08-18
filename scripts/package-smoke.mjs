import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const temp = await mkdtemp(path.join(os.tmpdir(), 'oxs-ui-package-smoke-'));

function run(args, cwd = root) {
  const result = spawnSync(pnpm, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} failed with ${result.status}`);
  }
}

function runNode(args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`node ${args.join(' ')} failed with ${result.status}`);
  }
}

try {
  const packs = path.join(temp, 'packs');
  await mkdir(packs);
  run(['--dir', 'packages/ui', 'pack', '--pack-destination', packs]);

  const tarballs = (await readdir(packs)).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one tarball, found ${tarballs.length}`);
  }

  const tarball = path.join(packs, tarballs[0]);
  const consumer = path.join(temp, 'consumer');
  await mkdir(path.join(consumer, 'src'), { recursive: true });

  await writeFile(
    path.join(consumer, 'package.json'),
    `${JSON.stringify(
      {
        name: 'oxs-ui-package-smoke',
        private: true,
        type: 'module',
        dependencies: {
          '@oxs/ui': `file:${tarball}`,
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
    `import '@oxs/ui/styles.css';
import { Button, Stack, UiRoot, type SystemKeyboardSurfaceState } from '@oxs/ui';
import { usePress } from '@oxs/ui/advanced';

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
    </Stack>
  </UiRoot>
);
`,
  );

  run(['install', '--prefer-offline', '--ignore-scripts', '--strict-peer-dependencies'], consumer);
  runNode(['--input-type=module', '--eval', "await import('@oxs/ui'); await import('@oxs/ui/advanced');"], consumer);
  run(['exec', 'tsc', '--noEmit', '-p', 'tsconfig.json', '--pretty', 'false'], consumer);
  run(['exec', 'vite', 'build'], consumer);
  console.log('Published-tarball consumer smoke passed: install · Node import · types · explicit styles export · Vite build.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
