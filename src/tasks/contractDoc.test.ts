import { describe, expect, it } from 'vitest';
import contractDoc from '../../docs/contracts/tasks.md?raw';

// Keeps docs/contracts/tasks.md and src/features/ in step: each feature file has exactly one owner,
// and every export the document names exists.
const featureModules = import.meta.glob<Record<string, unknown>>(
  ['../features/**/*.{ts,tsx}', '!../features/**/*.test.{ts,tsx}'],
  { eager: true },
);
const featureFiles = Object.keys(featureModules).map((path) => path.replace('../', 'src/'));

const ownership = contractDoc.slice(contractDoc.indexOf('## 2. Ownership'), contractDoc.indexOf('## 3.'));
const rows = [...ownership.matchAll(/^\| `([^`]+)` \| (.*?) \| .* \|$/gm)].map(([, file, exportsCell]) => ({
  file,
  exportNames: [...exportsCell.matchAll(/(?:^|, )`(\w+)/g)].map(([, name]) => name),
}));
const owners = [...ownership.matchAll(/^### (F\d) /gm)].map(([, feature]) => feature);

describe('docs/contracts/tasks.md', () => {
  it('has an ownership table for each of F1 to F6', () => {
    expect(owners).toEqual(['F1', 'F2', 'F3', 'F4', 'F5', 'F6']);
  });

  it('owns every file under src/features/ exactly once', () => {
    expect(featureFiles.length).toBeGreaterThan(0);
    for (const file of featureFiles) {
      expect(rows.filter((row) => row.file === file), file).toHaveLength(1);
    }
  });

  it('lists no file twice', () => {
    const files = rows.map((row) => row.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('names only exports that exist', () => {
    const existing = rows.filter((row) => featureFiles.includes(row.file));
    expect(existing).toHaveLength(featureFiles.length);
    for (const { file, exportNames } of existing) {
      expect(exportNames.length, file).toBeGreaterThan(0);
      const module = featureModules[file.replace('src/', '../')];
      for (const name of exportNames) expect(module, `${file} exports ${name}`).toHaveProperty(name);
    }
  });

  it('says that changing the contract needs an issue of its own', () => {
    expect(contractDoc).toContain('## 5. Changing the contract');
    expect(contractDoc).toMatch(/changing a contract type, a signature, a prop, an action, or a file's owner needs an issue of its own/);
  });
});
