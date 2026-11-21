/** @fileoverview Проверки подтверждения остановки контейнера перед переносом Telegram-сессии. */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { it, type TestContext } from 'node:test';
import { DockerCutoverExitProof } from './docker-cutover-exit-proof';

const containerId = 'a'.repeat(64);

/**
 * Создаёт временный файл, который в рабочем запуске записывает Docker.
 * @param test - Контекст очистки тестового каталога.
 * @param id - Содержимое файла идентификатора.
 * @returns Путь к файлу контейнера.
 */
function createCidFile(test: TestContext, id = containerId): string {
  const directory = mkdtempSync(join(tmpdir(), 'botcraft-cutover-test-'));
  const file = join(directory, 'worker.cid');
  writeFileSync(file, `${id}\n`);
  test.after(() => {
    rmSync(file, { force: true });
    rmdirSync(directory);
  });
  return file;
}

it('проверяет полный ID того же контейнера после закрытия команды Docker', async test => {
  const cidFile = createCidFile(test);
  const environment = { DOCKER_CONTEXT: 'тестовый-контекст' };
  const calls: string[][] = [];
  const proof = new DockerCutoverExitProof(cidFile, environment, async (args, env) => {
    assert.equal(env, environment);
    calls.push(args);
    return `${containerId}\texited`;
  });
  proof.onCliClose();

  assert.equal(existsSync(cidFile), false);
  assert.equal(await proof.confirm(() => true, 50), true);
  assert.deepEqual(calls, [
    ['container', 'ls', '--all', '--no-trunc', '--filter', `id=${containerId}`, '--format', '{{.ID}}\t{{.State}}'],
  ]);
});

it('подтверждает удалённый контейнер только успешным ответом Docker', async test => {
  const cidFile = createCidFile(test);
  const unreachable = new DockerCutoverExitProof(cidFile, {}, async () => { throw new Error('Docker недоступен'); });
  assert.equal(await unreachable.confirm(() => true, 10), false);
  const absent = new DockerCutoverExitProof(cidFile, {}, async () => '');
  assert.equal(await absent.confirm(() => true, 50), true);
});

it('не доверяет неполному ID или ответу про другой контейнер', async test => {
  const invalidFile = createCidFile(test, 'a'.repeat(12));
  let calls = 0;
  const invalid = new DockerCutoverExitProof(invalidFile, {}, async () => { calls += 1; return ''; });
  assert.equal(await invalid.confirm(() => true, 50), false);
  assert.equal(calls, 0);

  const otherId = 'b'.repeat(64);
  const mismatch = new DockerCutoverExitProof(createCidFile(test), {}, async () => `${otherId}\texited`);
  assert.equal(await mismatch.confirm(() => true, 10), false);
});

it('после принудительной остановки повторно запрашивает состояние того же контейнера', async test => {
  const calls: string[][] = [];
  let stopped = false;
  const proof = new DockerCutoverExitProof(createCidFile(test), {}, async args => {
    calls.push(args);
    if (args[1] === 'kill') {
      stopped = true;
      return containerId;
    }
    return `${containerId}\t${stopped ? 'dead' : 'running'}`;
  });

  assert.equal(await proof.confirm(() => false, 100), true);
  assert.equal(calls[0][1], 'ls');
  assert.deepEqual(calls[1], ['container', 'kill', containerId]);
  assert.equal(calls[2][1], 'ls');
});
