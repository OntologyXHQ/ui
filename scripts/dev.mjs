import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const mode = process.argv[2] ?? 'both';
const allowed = new Set(['both', 'ui', 'demo']);
if (!allowed.has(mode)) {
  console.error(
    `Unknown dev target ${JSON.stringify(mode)}. Use: pnpm dev, pnpm dev ui, or pnpm dev demo.`,
  );
  process.exit(2);
}

if (mode === 'both' || mode === 'ui') {
  const catalog = spawnSync('pnpm', ['catalog:generate'], { stdio: 'inherit', env: process.env });
  if (catalog.status !== 0) process.exit(catalog.status ?? 1);
}

const specs = [];
if (mode === 'both' || mode === 'ui') specs.push(['UI Studio', '@ontologyx/ui-studio']);
if (mode === 'both' || mode === 'demo') specs.push(['System demo', '@ontologyx/ui-demo']);

const children = specs.map(([label, pkg]) => {
  console.log(`Starting ${label}…`);
  return spawn('pnpm', ['--filter', pkg, 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, BROWSER: 'none' },
  });
});

let shuttingDown = false;
function stop(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill(signal);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stop(signal);
    process.exitCode = signal === 'SIGINT' ? 130 : 143;
  });
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (code === 0 && children.length === 1) {
      shuttingDown = true;
      return;
    }
    console.error(
      `A dev process exited (${signal ?? code ?? 'unknown'}); stopping the remaining process(es).`,
    );
    process.exitCode = code && code !== 0 ? code : 1;
    stop();
  });
}
