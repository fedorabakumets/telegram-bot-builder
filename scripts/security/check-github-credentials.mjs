/** @fileoverview Проверяет отслеживаемые Git-файлы на встроенные GitHub-токены. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { credentialLines, githubCredentialPattern } from './github-credential-patterns.mjs';

/** Git возвращает только пути: содержимое строк с секретами не попадает в журнал. */
const result = spawnSync('git', ['grep', '-l', '-z', '-I', '-E', githubCredentialPattern, '--', '.'], {
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024,
});
if (result.error || ![0, 1].includes(result.status)) {
  console.error('Не удалось проверить отслеживаемые файлы Git.');
  process.exitCode = 2;
} else if (result.status === 1) {
  console.log('Встроенные GitHub-токены в отслеживаемых файлах не найдены.');
} else {
  for (const file of result.stdout.split('\0').filter(Boolean)) {
    for (const line of credentialLines(readFileSync(file, 'utf8'))) {
      console.error(`Обнаружен встроенный GitHub-токен: ${file}:${line}. Значение скрыто.`);
    }
  }
  process.exitCode = 1;
}
