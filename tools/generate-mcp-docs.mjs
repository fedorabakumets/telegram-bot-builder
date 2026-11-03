/** @fileoverview Запуск генерации документации из реестра SDK с настройками проекта. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./mcp-catalog/generate.ts', import.meta.url));
const config = fileURLToPath(new URL('./mcp-server/tsconfig.json', import.meta.url));
const result = spawnSync(process.execPath, ['--import', 'tsx', script], {
  stdio: 'inherit', env: { ...process.env, TSX_TSCONFIG_PATH: config },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
