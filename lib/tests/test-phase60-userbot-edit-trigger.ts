/**
 * @fileoverview Интеграционные тесты для узла userbot_edit_trigger (фаза 60)
 *
 * Блок A: Базовая генерация
 * Блок B: Фильтрация (contains, regex)
 * Блок C: Сохранение переменных
 * Блок D: Автопереход
 * Блок E: Комбинированные сценарии
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase60_${label}`, userDatabaseEnabled: true, enableComments: false, projectId: 1 });
}

function genNoProject(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase60_${label}`, userDatabaseEnabled: true, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p60_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try { execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' }); fs.unlinkSync(tmp); return { ok: true }; }
  catch (e: any) { try { fs.unlinkSync(tmp); } catch {} return { ok: false, error: e.stderr?.toString() ?? String(e) }; }
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

function test(id: string, name: string, fn: () => void) {
  try { fn(); results.push({ id, name, passed: true, note: 'OK' }); console.log(`  ✅ ${id}. ${name}`); }
  catch (e: any) { results.push({ id, name, passed: false, note: e.message }); console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`); }
}

function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }
function syntax(code: string, label: string) { const r = checkSyntax(code, label); ok(r.ok, `Синтаксическая ошибка:\n${r.error}`); }

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/** Создаёт узел userbot_edit_trigger */
function makeUserbotEditTriggerNode(id: string, opts: any = {}) {
  return {
    id, type: 'userbot_edit_trigger' as any, position: { x: 0, y: 0 },
    data: {
      userbotEntity: opts.userbotEntity || '',
      filterType: opts.filterType || 'any',
      filterValue: opts.filterValue || '',
      saveTextTo: opts.saveTextTo || '',
      saveMessageIdTo: opts.saveMessageIdTo || '',
      saveChatIdTo: opts.saveChatIdTo || '',
      saveSenderIdTo: opts.saveSenderIdTo || '',
      autoTransitionTo: opts.autoTransitionTo || '',
      enableAutoTransition: !!opts.autoTransitionTo,
    },
  };
}

/** Создаёт message-узел */
function makeMessageNode(id: string, text = 'test') {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

/** Создаёт command_trigger узел */
function makeCommandTrigger(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: cmd, autoTransitionTo: target, enableAutoTransition: true, description: '', showInMenu: true, adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 60 — Узел userbot_edit_trigger                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'userbot_edit_trigger → генерируется events.MessageEdited', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a01');
  ok(code.includes('events.MessageEdited'), 'events.MessageEdited должен быть в коде');
});

test('A02', 'генерируется handle_userbot_edit_ с nodeId', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a02');
  ok(code.includes('handle_userbot_edit_uet1'), 'handle_userbot_edit_uet1 должен быть в коде');
});

test('A03', 'содержит event.message.text', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a03');
  ok(code.includes('event.message.text'), 'event.message.text должен быть в коде');
});

test('A04', 'содержит event.message.id', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a04');
  ok(code.includes('event.message.id'), 'event.message.id должен быть в коде');
});

test('A05', 'содержит event.chat_id', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a05');
  ok(code.includes('event.chat_id'), 'event.chat_id должен быть в коде');
});

test('A06', 'содержит event.sender_id', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a06');
  ok(code.includes('event.sender_id'), 'event.sender_id должен быть в коде');
});

test('A07', 'содержит logging.info с "edit trigger"', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.info'), 'logging.info должен быть в коде');
  ok(code.includes('edit trigger') || code.includes('Userbot edit trigger') || code.includes('✏️'), 'лог с описанием edit trigger должен быть в коде');
});

test('A08', 'содержит userbot_client (Telethon)', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1')]);
  const code = gen(p, 'a08');
  ok(code.includes('userbot_client'), 'userbot_client должен быть в коде');
});

test('A09', 'синтаксис Python OK (базовый userbot_edit_trigger)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Привет'),
    makeUserbotEditTriggerNode('uet1'),
  ]);
  syntax(gen(p, 'a09'), 'a09');
});

test('A10', 'без userbotEntity → events.MessageEdited() без chats', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { userbotEntity: '' })]);
  const code = gen(p, 'a10');
  ok(code.includes('events.MessageEdited()'), 'events.MessageEdited() без chats должен быть в коде');
});

test('A11', 'с userbotEntity → events.MessageEdited(chats=...)', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { userbotEntity: '@my_channel' })]);
  const code = gen(p, 'a11');
  ok(code.includes('events.MessageEdited(chats='), 'events.MessageEdited(chats=...) должен быть в коде');
  ok(code.includes('@my_channel'), '@my_channel должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Фильтрация (contains, regex)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Фильтрация ────────────────────────────────────────────');

test('B01', 'filterType=any → нет блока фильтрации', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { filterType: 'any' })]);
  const code = gen(p, 'b01');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  ok(!handlerBlock.includes('not in _edit_text'), 'Фильтр contains НЕ должен быть при filterType=any');
  ok(!handlerBlock.includes('_re_edit.search'), 'Фильтр regex НЕ должен быть при filterType=any');
});

test('B02', 'filterType=contains → содержит "not in _edit_text"', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { filterType: 'contains', filterValue: 'цена' })]);
  const code = gen(p, 'b02');
  ok(code.includes('not in _edit_text'), '"not in _edit_text" должен быть в коде');
  ok(code.includes('"цена"') || code.includes("'цена'"), 'значение фильтра "цена" должно быть в коде');
});

test('B03', 'filterType=regex → содержит re.search', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { filterType: 'regex', filterValue: '\\d+\\.\\d+' })]);
  const code = gen(p, 'b03');
  ok(code.includes('_re_edit.search') || code.includes('re.search'), 're.search должен быть в коде');
});

test('B04', 'filterType=contains без filterValue → нет фильтра', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { filterType: 'contains', filterValue: '' })]);
  const code = gen(p, 'b04');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  ok(!handlerBlock.includes('not in _edit_text'), 'Фильтр НЕ должен быть без filterValue');
});

test('B05', 'filterType=regex без filterValue → нет фильтра', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { filterType: 'regex', filterValue: '' })]);
  const code = gen(p, 'b05');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  ok(!handlerBlock.includes('_re_edit.search'), 'Regex фильтр НЕ должен быть без filterValue');
});

test('B06', 'синтаксис OK (contains фильтр)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
    makeUserbotEditTriggerNode('uet1', { userbotEntity: '@ch', filterType: 'contains', filterValue: 'обновлено' }),
  ]);
  syntax(gen(p, 'b06'), 'b06');
});

test('B07', 'синтаксис OK (regex фильтр)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
    makeUserbotEditTriggerNode('uet1', { userbotEntity: '@ch', filterType: 'regex', filterValue: '\\d{3,}' }),
  ]);
  syntax(gen(p, 'b07'), 'b07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Сохранение переменных
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Сохранение переменных ─────────────────────────────────');

test('C01', 'saveTextTo → set_user_var с именем переменной', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveTextTo: 'edited_text' })]);
  const code = gen(p, 'c01');
  ok(code.includes('set_user_var') && code.includes('edited_text'), 'set_user_var с "edited_text" должен быть в коде');
});

test('C02', 'saveMessageIdTo → set_user_var с ID сообщения', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveMessageIdTo: 'msg_id_var' })]);
  const code = gen(p, 'c02');
  ok(code.includes('set_user_var') && code.includes('msg_id_var'), 'set_user_var с "msg_id_var" должен быть в коде');
});

test('C03', 'saveChatIdTo → set_user_var с ID чата', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveChatIdTo: 'chat_id_var' })]);
  const code = gen(p, 'c03');
  ok(code.includes('set_user_var') && code.includes('chat_id_var'), 'set_user_var с "chat_id_var" должен быть в коде');
});

test('C04', 'saveSenderIdTo → set_user_var с ID отправителя', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveSenderIdTo: 'sender_var' })]);
  const code = gen(p, 'c04');
  ok(code.includes('set_user_var') && code.includes('sender_var'), 'set_user_var с "sender_var" должен быть в коде');
});

test('C05', 'без save-полей → рендерер использует дефолты из схемы (edit_text, edit_msg_id)', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', {
    saveTextTo: '', saveMessageIdTo: '', saveChatIdTo: '', saveSenderIdTo: '',
  })]);
  const code = gen(p, 'c05');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  // Рендерер подставляет дефолты из zod-схемы: edit_text и edit_msg_id
  ok(handlerBlock.includes('edit_text') || handlerBlock.includes('edit_msg_id'), 'Дефолтные переменные должны быть в коде');
});

test('C06', 'все save-поля заполнены → 4 вызова set_user_var', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', {
    saveTextTo: 'txt', saveMessageIdTo: 'mid', saveChatIdTo: 'cid', saveSenderIdTo: 'sid',
  })]);
  const code = gen(p, 'c06');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  const matches = handlerBlock.match(/set_user_var/g) || [];
  ok(matches.length >= 4, `Ожидается >= 4 вызовов set_user_var, получено ${matches.length}`);
});

test('C07', 'saveTextTo → сохраняет _edit_text', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveTextTo: 'my_text' })]);
  const code = gen(p, 'c07');
  ok(code.includes('_edit_text'), '_edit_text должен быть в коде');
});

test('C08', 'saveMessageIdTo → сохраняет _edit_msg_id', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveMessageIdTo: 'my_mid' })]);
  const code = gen(p, 'c08');
  ok(code.includes('_edit_msg_id'), '_edit_msg_id должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Автопереход
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Автопереход ───────────────────────────────────────────');

test('D01', 'autoTransitionTo → FakeCallbackQuery', () => {
  const p = makeCleanProject([
    makeUserbotEditTriggerNode('uet1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd01');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть в коде');
});

test('D02', 'autoTransitionTo → вызов handle_callback_ целевого узла', () => {
  const p = makeCleanProject([
    makeUserbotEditTriggerNode('uet1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd02');
  ok(code.includes('handle_callback_msg1'), 'handle_callback_msg1 должен быть в коде');
});

test('D03', 'без autoTransitionTo → нет FakeCallbackQuery', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { autoTransitionTo: '' })]);
  const code = gen(p, 'd03');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 3000);
  ok(!handlerBlock.includes('FakeCallbackQuery'), 'FakeCallbackQuery НЕ должен быть без autoTransitionTo');
});

test('D04', 'autoTransitionTo → содержит try/except для ошибок', () => {
  const p = makeCleanProject([
    makeUserbotEditTriggerNode('uet1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd04');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 3000);
  ok(handlerBlock.includes('except') && handlerBlock.includes('Exception'), 'try/except для автоперехода должен быть в коде');
});

test('D05', 'синтаксис OK (с автопереходом)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Привет'),
    makeUserbotEditTriggerNode('uet1', {
      userbotEntity: '@channel',
      filterType: 'contains',
      filterValue: 'обновлено',
      saveTextTo: 'txt',
      autoTransitionTo: 'msg1',
    }),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Комбинированные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Комбинированные сценарии ──────────────────────────────');

test('E01', 'несколько userbot_edit_trigger нод → все генерируются', () => {
  const p = makeCleanProject([
    makeUserbotEditTriggerNode('uet1', { userbotEntity: '@ch1' }),
    makeUserbotEditTriggerNode('uet2', { userbotEntity: '@ch2' }),
    makeUserbotEditTriggerNode('uet3', { userbotEntity: '@ch3' }),
  ]);
  const code = gen(p, 'e01');
  ok(code.includes('handle_userbot_edit_uet1'), 'handle_userbot_edit_uet1 должен быть в коде');
  ok(code.includes('handle_userbot_edit_uet2'), 'handle_userbot_edit_uet2 должен быть в коде');
  ok(code.includes('handle_userbot_edit_uet3'), 'handle_userbot_edit_uet3 должен быть в коде');
});

test('E02', 'полный сценарий: trigger + filter + save + transition (синтаксис OK)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'Бот запущен'),
    makeUserbotEditTriggerNode('uet1', {
      userbotEntity: '@price_channel',
      filterType: 'regex',
      filterValue: '\\$\\d+',
      saveTextTo: 'price_text',
      saveMessageIdTo: 'price_msg_id',
      saveChatIdTo: 'price_chat',
      saveSenderIdTo: 'price_sender',
      autoTransitionTo: 'msg1',
    }),
  ]);
  syntax(gen(p, 'e02'), 'e02');
});

test('E03', 'userbot_edit_trigger рядом с другими userbot-нодами (синтаксис OK)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1', 'OK'),
    makeUserbotEditTriggerNode('uet1', { userbotEntity: '@ch', saveTextTo: 'txt' }),
    { id: 'ubm1', type: 'userbot_message' as any, position: { x: 0, y: 0 }, data: { messageText: 'Тест', formatMode: 'html', userbotEntity: '@ch', attachedMedia: [], disableLinkPreview: false, saveMessageIdTo: '', autoTransitionTo: '', enableAutoTransition: false } },
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

test('E04', 'дефисы в nodeId корректно заменяются на подчёркивания', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet-node-1')]);
  const code = gen(p, 'e04');
  ok(code.includes('handle_userbot_edit_uet_node_1'), 'Дефисы должны быть заменены на подчёркивания в имени функции');
});

test('E05', 'user_data инициализация присутствует', () => {
  const p = makeCleanProject([makeUserbotEditTriggerNode('uet1', { saveTextTo: 'txt' })]);
  const code = gen(p, 'e05');
  const handlerIdx = code.indexOf('handle_userbot_edit_uet1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 2000);
  ok(handlerBlock.includes('user_data[user_id]'), 'user_data[user_id] должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// Итоги
// ════════════════════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════════════════');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n📊 Итого: ${passed} ✅ / ${failed} ❌ из ${results.length} тестов`);

if (failed > 0) {
  console.log('\n❌ Провалены:');
  results.filter(r => !r.passed).forEach(r => console.log(`   ${r.id}. ${r.name}: ${r.note}`));
  process.exit(1);
}

console.log('\n✅ Все тесты фазы 60 (userbot_edit_trigger) пройдены!\n');
