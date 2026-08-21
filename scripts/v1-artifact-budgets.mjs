import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const budgetFile = path.join(process.cwd(), 'docs', 'quality', 'V1_ARTIFACT_BUDGETS.json');

async function filesUnder(root, files = []) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await filesUnder(target, files);
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

async function sum(root, predicate) {
  const files = await filesUnder(root);
  let bytes = 0;
  let count = 0;
  for (const file of files) {
    if (!predicate(file)) continue;
    bytes += (await stat(file)).size;
    count += 1;
  }
  return { bytes, files: count };
}

export async function measureV1Artifacts() {
  const root = process.cwd();
  const uiPackage = JSON.parse(await readFile(path.join(root, 'packages/ui/package.json'), 'utf8'));
  const uiDist = path.join(root, 'packages/ui/dist');
  const studioDist = path.join(root, 'apps/ui-studio/dist');
  const artifacts = path.join(root, 'artifacts');
  const artifactNames = await readdir(artifacts);
  const tarballName = artifactNames
    .filter((name) => name.includes('ontologyx-ui') && name.endsWith(`-${uiPackage.version}.tgz`))
    .sort()
    .at(-1);
  if (!tarballName) throw new Error(`Missing packed @ontologyx/ui@${uiPackage.version} artifact.`);

  const [uiJs, uiCss, uiTypes, studioJs, studioCss] = await Promise.all([
    sum(uiDist, (file) => /\.(?:m?js|cjs)$/.test(file)),
    sum(uiDist, (file) => file.endsWith('.css')),
    sum(uiDist, (file) => file.endsWith('.d.ts')),
    sum(studioDist, (file) => /\.(?:m?js|cjs)$/.test(file)),
    sum(studioDist, (file) => file.endsWith('.css')),
  ]);
  const tarballBytes = (await stat(path.join(artifacts, tarballName))).size;
  return {
    version: uiPackage.version,
    metrics: {
      packageJavaScript: uiJs,
      packageCss: uiCss,
      packageTypes: uiTypes,
      studioJavaScript: studioJs,
      studioCss,
      packedTarball: { bytes: tarballBytes, files: 1 },
    },
  };
}

export function measuredLimit(bytes) {
  const measuredHeadroom = Math.max(1024, Math.ceil(bytes * 0.1));
  return Math.ceil((bytes + measuredHeadroom) / 1024) * 1024;
}
