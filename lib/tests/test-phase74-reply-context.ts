/**
 * @fileoverview Интеграционные тесты переменных контекста сообщения (фаза 74)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: unknown[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase74_${label}`, userDatabaseEnabled: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p74_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
    return { ok: true };
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    return { ok: false, error: e.stderr?.toString() ?? String(e) };
  }
}

function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

function makeCommandTrigger(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: { command, showInMenu: true, autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

function makeTextTrigger(id: string, synonyms: string[], targetId: string) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: { textSynonyms: synonyms, textMatchType: 'exact', autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

function makeIncomingTrigger(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

function makeMessageNode(id: string, text: string) {
  return {
    id,
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

function makeBotTableRead(id: string, targetId: string) {
  return {
    id,
    type: 'bot_table',
    position: { x: 200, y: 0 },
    data: {
      tableName: 'profiles',
      operation: 'read',
      where: [{ column: 'telegram_id', value: '{reply_to_user_id}' }],
      saveResultTo: 'target',
      resultFormat: 'first_row',
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

console.log('\n=== Фаза 74: переменные контекста сообщения ===\n');

const cmdCode = gen(makeCleanProject([
  makeCommandTrigger('cmd1', '/profile', 'msg1'),
  makeMessageNode('msg1', 'Профиль @{reply_to_username}'),
]), 'cmd');

ok(cmdCode.includes('async def capture_message_context'), 'должна быть capture_message_context');
ok(cmdCode.includes("store['reply_to_user_id']"), 'должна записываться reply_to_user_id');
ok(cmdCode.includes('await capture_message_context(user_id, message)'), 'command_trigger должен вызывать capture');
syntax(cmdCode, 'cmd');

const txtCode = gen(makeCleanProject([
  makeTextTrigger('txt1', ['халява'], 'msg1'),
  makeMessageNode('msg1', 'ok'),
]), 'txt');

ok(txtCode.includes('await capture_message_context(user_id, message)'), 'text_trigger должен вызывать capture');
syntax(txtCode, 'txt');

const imtCode = gen(makeCleanProject([
  makeIncomingTrigger('imt1', 'msg1'),
  makeMessageNode('msg1', 'ok'),
]), 'imt');

ok(imtCode.includes('await capture_message_context(user_id, event)'), 'incoming_message_trigger должен вызывать capture');
syntax(imtCode, 'imt');

const tblCode = gen(makeCleanProject([
  makeCommandTrigger('cmd1', '/profile', 'tbl1'),
  makeBotTableRead('tbl1', 'msg1'),
  makeMessageNode('msg1', 'done'),
]), 'tbl');

ok(tblCode.includes('reply_to_user_id'), 'bot_table должен использовать reply_to_user_id');
ok(tblCode.includes("store['chat_type']"), 'должен записываться chat_type');
ok(tblCode.includes('_empty_reply'), 'должен быть сброс reply-полей');
syntax(tblCode, 'tbl');

console.log('\n✅ Все тесты фазы 74 пройдены!\n');
