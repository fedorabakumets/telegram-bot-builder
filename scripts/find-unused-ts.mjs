/**
 * Находит .ts/.tsx файлы в lib/, которые нигде не импортируются
 * (ни из lib/, ни из client/, ни из server/, ни из shared/)
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve, extname, basename } from 'path';

const ROOT = resolve('.');
const SEARCH_DIRS = ['lib', 'client', 'server', 'shared'];
const TARGET_DIR = 'lib';

// Собираем все .ts/.tsx файлы в lib/
function collectFiles(dir, exts = ['.ts', '.tsx']) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Пропускаем node_modules и .venv
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      results.push(...collectFiles(full, exts));
    } else if (exts.includes(extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

// Собираем все импорты из всех файлов в SEARCH_DIRS
function collectAllImports(dirs) {
  const importedPaths = new Set();
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const dir of dirs) {
    let files;
    try { files = collectFiles(dir); } catch { continue; }

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const fileDir = join(file, '..');

      for (const regex of [importRegex, requireRegex]) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(content)) !== null) {
          importedPaths.add(match[1]);
          // Нормализуем относительные пути к абсолютным
          if (match[1].startsWith('.')) {
            const abs = resolve(fileDir, match[1]);
            importedPaths.add(abs);
            // Добавляем варианты с расширениями
            for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
              importedPaths.add(abs + ext);
            }
          }
        }
      }
    }
  }
  return importedPaths;
}

const targetFiles = collectFiles(TARGET_DIR);
const allImports = collectAllImports(SEARCH_DIRS);

const unused = [];

for (const file of targetFiles) {
  const absFile = resolve(file);
  const relFile = relative(ROOT, file);

  // Пропускаем тестовые файлы, fixture, index файлы и d.ts
  const name = basename(file);
  if (
    name.endsWith('.test.ts') ||
    name.endsWith('.spec.ts') ||
    name.endsWith('.d.ts') ||
    name.endsWith('.fixture.ts') ||
    name === 'index.ts' ||
    name === 'index.tsx'
  ) continue;

  // Проверяем: упоминается ли файл в импортах
  const isImported =
    allImports.has(absFile) ||
    allImports.has(absFile.replace(/\.tsx?$/, '')) ||
    // Проверяем по относительному пути (без расширения)
    [...allImports].some(imp => {
      if (!imp.includes('/')) return false;
      const impAbs = resolve(imp);
      return (
        impAbs === absFile ||
        impAbs + '.ts' === absFile ||
        impAbs + '.tsx' === absFile
      );
    });

  if (!isImported) {
    unused.push(relFile);
  }
}

console.log(`\nНайдено потенциально неиспользуемых файлов: ${unused.length}\n`);
unused.sort().forEach(f => console.log(' ', f));
