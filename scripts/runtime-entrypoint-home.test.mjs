/** @fileoverview Регрессии HOME после gosu без реальных изменений владельцев и системных каталогов. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

/** Git Bash доступен в Windows; в Linux используется обычный bash из PATH. */
const bash = process.platform === 'win32' && existsSync('C:/Program Files/Git/bin/bash.exe')
  ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
/** Корень репозитория, не зависящий от текущего каталога запуска теста. */
const root = fileURLToPath(new URL('../', import.meta.url));
/** Обёртки подавляют системные записи и воспроизводят сброс HOME числовым gosu. */
const harness = `
id() { printf '%s' "$TEST_EFFECTIVE_UID"; }
mkdir() { :; }
chown() { :; }
gosu() { shift; HOME=/; export HOME; "$@"; }
exec() { "$@"; exit "$?"; }
set -- sh -c 'printf "%s\\n" "$HOME"; printenv ANALYTICS_SPOOL_DIR || printf "unset\\n"'
. server/runner/runtime-entrypoint.sh
`;

/** Исполняет настоящий entrypoint с подменой только привилегированных команд. */
function runEntrypoint(home, spool, uid = '0') {
  const env = { ...process.env, HOME: home, TEST_EFFECTIVE_UID: uid };
  delete env.ANALYTICS_SPOOL_DIR;
  if (spool !== undefined) env.ANALYTICS_SPOOL_DIR = spool;
  return execFileSync(bash, ['--noprofile', '--norc', '-c', harness], { cwd: root, env, encoding: 'utf8' }).trim().split(/\r?\n/);
}

test('числовой gosu сохраняет HOME образа вместо корня файловой системы', () => {
  assert.deepEqual(runEntrypoint('/home/botcraft'), ['/home/botcraft', 'unset']);
});

test('явные HOME и каталог аналитики не заменяются запасным расположением', () => {
  assert.deepEqual(runEntrypoint('/configured-home', '/persistent/analytics'), ['/configured-home', '/persistent/analytics']);
});

test('готовый непривилегированный процесс сохраняет исходное окружение', () => {
  assert.deepEqual(runEntrypoint('/existing-home', '/existing-spool', '10001'), ['/existing-home', '/existing-spool']);
});
