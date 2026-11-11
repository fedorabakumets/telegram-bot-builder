/** @fileoverview Проверка отсутствия служб панели в графе зависимостей исполнителя ботов. */
import { build } from 'esbuild';
import { expect, it } from 'vitest';

it('собирает runtime без маршрутов, аналитики, хранилищ и общего пула панели', async () => {
  const result = await build({ entryPoints: ['server/runner/index.ts'], bundle: true, platform: 'node',
    format: 'cjs', packages: 'external', write: false, metafile: true, tsconfig: 'tsconfig.node.json' });
  const inputs = Object.keys(result.metafile!.inputs).map(path => path.replaceAll('\\', '/'));
  expect(inputs.some(path => /server\/(routes|database|storages|analytics|terminal)\//.test(path))).toBe(false);
  expect(inputs).toContain('server/runner/runnerCommandFence.ts');
});
