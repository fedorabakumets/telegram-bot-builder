/**
 * @fileoverview Сборка серверного JavaScript для запуска Node.js без загрузчика TypeScript.
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Корень проекта определяется расположением скрипта, а не рабочим каталогом. */
const rootDir = fileURLToPath(new URL('../', import.meta.url));

/** Пакеты остаются внешними: сохраняются их штатные загрузчики и нативные зависимости. */
await build({
  absWorkingDir: rootDir,
  entryPoints: ['server/index.ts'],
  outfile: resolve(rootDir, 'dist/server/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  tsconfig: 'tsconfig.node.json',
  sourcemap: 'linked',
  sourcesContent: false,
  logLevel: 'info',
  banner: {
    js: `/** @fileoverview Собранная точка входа сервера; создаётся scripts/build-server.mjs. */
import { createRequire as createServerRequire } from 'node:module';
const require = createServerRequire(import.meta.url);
process.env.NODE_ENV ??= 'production';`,
  },
});
