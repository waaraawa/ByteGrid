import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set(['coverage', 'dist', 'node_modules']);

const checks = [];

function addCheck(name, run) {
  checks.push({ name, run });
}

function listFiles(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        return [];
      }

      return listFiles(fullPath, predicate);
    }

    return predicate(fullPath) ? [fullPath] : [];
  });
}

addCheck('No CSS !important usage', () => {
  const cssFiles = listFiles(path.join(ROOT, 'packages'), (file) => file.endsWith('.css'));
  const violations = cssFiles.flatMap((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return content
      .split('\n')
      .map((line, index) => ({ file, line, lineNumber: index + 1 }))
      .filter(({ line }) => line.includes('!important'));
  });

  if (violations.length === 0) {
    return;
  }

  const details = violations
    .map(({ file, lineNumber }) => `${path.relative(ROOT, file)}:${lineNumber}`)
    .join('\n');
  throw new Error(`Avoid !important in plugin CSS:\n${details}`);
});

addCheck('Committed npm lockfile exists', () => {
  const lockfile = path.join(ROOT, 'package-lock.json');

  if (!fs.existsSync(lockfile)) {
    throw new Error('package-lock.json is required for reproducible dependency resolution');
  }
});

addCheck('Release workflow includes artifact attestation', () => {
  const workflowDir = path.join(ROOT, '.github', 'workflows');
  const workflowFiles = listFiles(workflowDir, (file) => /\.(ya?ml)$/.test(file));

  const hasAttestation = workflowFiles.some((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('actions/attest-build-provenance');
  });

  if (!hasAttestation) {
    throw new Error(
      'release workflow should attest release assets with actions/attest-build-provenance'
    );
  }
});

const failures = [];

for (const check of checks) {
  try {
    check.run();
    console.log(`PASS ${check.name}`);
  } catch (error) {
    failures.push({ name: check.name, error });
    console.error(`FAIL ${check.name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

if (failures.length > 0) {
  process.exitCode = 1;
}
