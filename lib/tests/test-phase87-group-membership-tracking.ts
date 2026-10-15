/**
 * @fileoverview Фаза 87 — добавление и исключение бота в группах.
 * Проверяет условную генерацию обработчика групп.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Минимальный рабочий проект для генератора. */
const project = { nodes: [{ id: 'start', type: 'command_trigger', position: { x: 0, y: 0 },
  data: { command: '/start', description: 'Старт', autoTransitionTo: 'answer' } },
{ id: 'answer', type: 'message', position: { x: 200, y: 0 }, data: { messageText: 'Привет', buttons: [] } }], edges: [] } as any;

/** Генерирует код с выбранным флагом групп. */
function code(enabled: boolean): string {
  return generatePythonCode(project, {
    projectId: 1, userDatabaseEnabled: true, trackUserBlocks: false, trackGroupMembership: enabled,
  });
}

const enabled = code(true);
assert.match(enabled, /async def track_group_bot_membership/);
assert.match(enabled, /Бота добавили в группу/);
assert.match(enabled, /Бота исключили из группы/);
assert.match(enabled, /INSERT INTO bot_groups/);
assert.match(enabled, /INSERT INTO chat_access/);
assert.match(enabled, /"chatId": _chat_id/);
assert.doesNotMatch(enabled, /async def track_private_bot_membership/);
const pythonFile = path.join(os.tmpdir(), 'tbb-phase87-group-membership.py');
fs.writeFileSync(pythonFile, enabled, 'utf8');
execFileSync('python', ['-m', 'py_compile', pythonFile], { stdio: 'pipe' });
fs.rmSync(pythonFile, { force: true });

const disabled = code(false);
assert.doesNotMatch(disabled, /track_group_bot_membership/);
assert.doesNotMatch(disabled, /@dp\.my_chat_member\(\)/);
console.log('✅ Фаза 87: слежение за группами генерируется только при включённой настройке');
