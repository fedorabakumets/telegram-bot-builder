/**
 * @fileoverview Фаза 86 — события блокировки и разблокировки бота
 * Проверяет условную генерацию my_chat_member и allowed_updates.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Минимальный рабочий проект для генератора */
const project = { nodes: [{ id: 'start', type: 'command_trigger', position: { x: 0, y: 0 },
  data: { command: '/start', description: 'Старт', autoTransitionTo: 'answer' } },
{ id: 'answer', type: 'message', position: { x: 200, y: 0 }, data: { messageText: 'Привет', buttons: [] } }], edges: [] } as any;

/** Генерирует код с выбранным флагом. */
function code(enabled: boolean): string {
  return generatePythonCode(project, {
    projectId: 1, userDatabaseEnabled: true, trackUserBlocks: enabled, trackGroupMembership: false,
  });
}

const enabled = code(true);
assert.match(enabled, /@dp\.my_chat_member\(\)/);
assert.match(enabled, /message_type, message_text.*'system'/s);
assert.match(enabled, /allowed_updates=dp\.resolve_used_update_types\(\)/);
assert.match(enabled, /UPDATE bot_users SET is_blocked/);
assert.match(enabled, /INSERT INTO chat_access/);
assert.match(enabled, /bot:message:/);
const pythonFile = path.join(os.tmpdir(), 'tbb-phase68-user-block-tracking.py');
fs.writeFileSync(pythonFile, enabled, 'utf8');
execFileSync('python', ['-m', 'py_compile', pythonFile], { stdio: 'pipe' });
fs.rmSync(pythonFile, { force: true });

const disabled = code(false);
assert.doesNotMatch(disabled, /@dp\.my_chat_member\(\)/);
assert.match(disabled, /allowed_updates=dp\.resolve_used_update_types\(\)/);
console.log('✅ Фаза 86: отслеживание блокировок генерируется только при включённой настройке');
