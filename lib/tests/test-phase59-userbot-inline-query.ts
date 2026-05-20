/**
 * @fileoverview Интеграционные тесты для узла userbot_inline_query (фаза 59)
 *
 * Блок A: Базовая генерация
 * Блок B: Параметры запроса
 * Блок C: Сохранение переменных
 * Блок D: get_content
 * Блок E: Автопереход и ошибки
 * Блок F: Сценарии
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
  return generatePythonCode(project as any, { botName: `Phase59_${label}`, userDatabaseEnabled: true, enableComments: false, projectId: 1 });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p59_${label}.py`;
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

/** Создаёт узел userbot_inline_query */
function makeUserbotInlineQueryNode(id: string, opts: any = {}) {
  return {
    id, type: 'userbot_inline_query' as any, position: { x: 0, y: 0 },
    data: {
      botUsername: opts.botUsername || '@inline_bot',
      query: opts.query || 'test',
      targetChat: opts.targetChat || '',
      sendToSameChat: opts.sendToSameChat ?? true,
      resultIndex: opts.resultIndex || '0',
      saveResultTitleTo: opts.saveResultTitleTo || '',
      saveResultDescTo: opts.saveResultDescTo || '',
      saveResponseIdTo: opts.saveResponseIdTo || '',
      autoTransitionTo: opts.autoTransitionTo || '',
      enableAutoTransition: !!opts.autoTransitionTo,
    },
  };
}

/** Создаёт узел userbot_message */
function makeUserbotMessageNode(id: string, opts: any = {}) {
  return {
    id, type: 'userbot_message' as any, position: { x: 0, y: 0 },
    data: {
      messageText: opts.messageText || 'Тест',
      formatMode: opts.formatMode || 'html',
      userbotEntity: opts.userbotEntity || '@test',
      attachedMedia: opts.attachedMedia || [],
      disableLinkPreview: opts.disableLinkPreview || false,
      saveMessageIdTo: opts.saveMessageIdTo || '',
      autoTransitionTo: opts.autoTransitionTo || '',
      enableAutoTransition: !!opts.autoTransitionTo,
    },
  };
}

/** Создаёт узел userbot_click_button */
function makeUserbotClickButtonNode(id: string, opts: any = {}) {
  return {
    id, type: 'userbot_click_button' as any, position: { x: 0, y: 0 },
    data: {
      userbotEntity: opts.userbotEntity || '@bot',
      messageId: opts.messageId || '123',
      clickMode: opts.clickMode || 'text',
      clickValue: opts.clickValue || 'Играть',
      saveAlertTo: opts.saveAlertTo || '',
      saveResultTo: opts.saveResultTo || '',
      saveButtonsTo: opts.saveButtonsTo || '',
      saveHasMediaTo: opts.saveHasMediaTo || '',
      saveMediaTo: opts.saveMediaTo || '',
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
console.log('║   Фаза 59 — Узел userbot_inline_query                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'userbot_inline_query → генерируется handle_callback_', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_uiq1'), 'handle_callback_uiq1 должен быть в коде');
});

test('A02', 'содержит userbot_client.inline_query', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'a02');
  ok(code.includes('userbot_client.inline_query'), 'userbot_client.inline_query должен быть в коде');
});

test('A03', 'содержит _result.click', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'a03');
  ok(code.includes('_result.click'), '_result.click должен быть в коде');
});

test('A04', 'содержит @dp.callback_query с nodeId', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'a04');
  ok(code.includes('"uiq1"'), 'callback_query с "uiq1" должен быть в коде');
});

test('A05', 'содержит logging.info с "inline_query"', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'a05');
  ok(code.includes('logging.info') && code.includes('inline_query'), 'logging.info с "inline_query" должен быть в коде');
});

test('A06', 'синтаксис Python OK', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'uiq1'),
    makeUserbotInlineQueryNode('uiq1'),
  ]);
  syntax(gen(p, 'a06'), 'a06');
});

test('A07', 'содержит Telethon импорт и StringSession', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'a07');
  ok(code.includes('from telethon') || code.includes('TelegramClient'), 'Импорт Telethon должен быть в коде');
  ok(code.includes('StringSession'), 'StringSession должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Параметры запроса
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Параметры запроса ─────────────────────────────────────');

test('B01', 'botUsername → содержит @bot в коде', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { botUsername: '@my_inline_bot' })]);
  const code = gen(p, 'b01');
  ok(code.includes('@my_inline_bot'), '@my_inline_bot должен быть в коде');
});

test('B02', 'query → содержит текст запроса', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { query: 'search phrase' })]);
  const code = gen(p, 'b02');
  ok(code.includes('search phrase'), 'текст запроса "search phrase" должен быть в коде');
});

test('B03', 'sendToSameChat=true → _target_chat = _bot', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { sendToSameChat: true })]);
  const code = gen(p, 'b03');
  ok(code.includes('_target_chat = _bot'), '_target_chat = _bot должен быть в коде');
});

test('B04', 'sendToSameChat=false → резолвит targetChat отдельно', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { sendToSameChat: false, targetChat: '@other_chat' })]);
  const code = gen(p, 'b04');
  ok(!code.includes('_target_chat = _bot') || code.includes('_target_raw'), 'targetChat должен резолвиться отдельно');
  ok(code.includes('@other_chat'), '@other_chat должен быть в коде');
});

test('B05', 'resultIndex → содержит _idx', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { resultIndex: '2' })]);
  const code = gen(p, 'b05');
  ok(code.includes('_idx'), '_idx должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Сохранение переменных
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Сохранение переменных ─────────────────────────────────');

test('C01', 'saveResultTitleTo → содержит set_user_var и title', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { saveResultTitleTo: 'res_title' })]);
  const code = gen(p, 'c01');
  ok(code.includes('set_user_var') && code.includes('title'), 'set_user_var с title должен быть в коде');
  ok(code.includes('res_title'), 'res_title должен быть в коде');
});

test('C02', 'saveResultDescTo → содержит set_user_var и description', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { saveResultDescTo: 'res_desc' })]);
  const code = gen(p, 'c02');
  ok(code.includes('set_user_var') && code.includes('description'), 'set_user_var с description должен быть в коде');
  ok(code.includes('res_desc'), 'res_desc должен быть в коде');
});

test('C03', 'saveResponseIdTo → содержит _sent.id', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { saveResponseIdTo: 'sent_id' })]);
  const code = gen(p, 'c03');
  ok(code.includes('_sent.id'), '_sent.id должен быть в коде');
  ok(code.includes('sent_id'), 'sent_id должен быть в коде');
});

test('C04', 'без save-полей → нет set_user_var', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'c04');
  const handlerIdx = code.indexOf('handle_callback_uiq1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 3000);
  ok(!handlerBlock.includes('set_user_var'), 'set_user_var НЕ должен быть в коде без save-полей');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: get_content
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: get_content ───────────────────────────────────────────');

test('D01', 'projectId → get_content для bot', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { botUsername: '@inline_bot' })]);
  const code = gen(p, 'd01');
  ok(code.includes('get_content') && code.includes('.bot'), 'get_content для bot должен быть в коде');
});

test('D02', 'projectId → get_content для query', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1', { query: 'hello' })]);
  const code = gen(p, 'd02');
  ok(code.includes('get_content') && code.includes('.query'), 'get_content для query должен быть в коде');
});

test('D03', 'без projectId → нет get_content', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = generatePythonCode(p as any, { botName: 'Phase59_d03', userDatabaseEnabled: true, enableComments: false });
  const handlerIdx = code.indexOf('handle_callback_uiq1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 3000);
  ok(!handlerBlock.includes('get_content'), 'get_content НЕ должен быть в коде без projectId');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Автопереход и ошибки
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Автопереход и ошибки ──────────────────────────────────');

test('E01', 'autoTransitionTo → FakeCallbackQuery', () => {
  const p = makeCleanProject([
    makeUserbotInlineQueryNode('uiq1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e01');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть в коде');
});

test('E02', 'содержит FloodWaitError', () => {
  const p = makeCleanProject([makeUserbotInlineQueryNode('uiq1')]);
  const code = gen(p, 'e02');
  ok(code.includes('FloodWait'), 'FloodWait обработка должна быть в коде');
});

test('E03', 'синтаксис OK (полный сценарий)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'uiq1'),
    makeUserbotInlineQueryNode('uiq1', {
      botUsername: '@game_bot',
      query: 'play',
      sendToSameChat: true,
      resultIndex: '0',
      saveResultTitleTo: 'title',
      saveResultDescTo: 'desc',
      saveResponseIdTo: 'resp_id',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1', 'Готово!'),
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Сценарии ──────────────────────────────────────────────');

test('F01', 'userbot_message → userbot_inline_query → message (синтаксис OK)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ubm1'),
    makeUserbotMessageNode('ubm1', { userbotEntity: '@bot', messageText: '/start', autoTransitionTo: 'uiq1' }),
    makeUserbotInlineQueryNode('uiq1', {
      botUsername: '@inline_bot',
      query: 'search',
      saveResultTitleTo: 'title',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1', 'Результат: {title}'),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'несколько userbot_inline_query нод → все генерируются', () => {
  const p = makeCleanProject([
    makeUserbotInlineQueryNode('uiq1', { query: 'first' }),
    makeUserbotInlineQueryNode('uiq2', { query: 'second' }),
    makeUserbotInlineQueryNode('uiq3', { query: 'third' }),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('handle_callback_uiq1'), 'handle_callback_uiq1 должен быть в коде');
  ok(code.includes('handle_callback_uiq2'), 'handle_callback_uiq2 должен быть в коде');
  ok(code.includes('handle_callback_uiq3'), 'handle_callback_uiq3 должен быть в коде');
});

test('F03', 'inline_query + click_button в одном проекте (синтаксис OK)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'uiq1'),
    makeUserbotInlineQueryNode('uiq1', {
      botUsername: '@game_bot',
      query: 'play',
      saveResponseIdTo: 'msg_id',
      autoTransitionTo: 'ucb1',
    }),
    makeUserbotClickButtonNode('ucb1', {
      userbotEntity: '@game_bot',
      messageId: '{msg_id}',
      clickMode: 'text',
      clickValue: 'Играть',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1', 'Готово!'),
  ]);
  syntax(gen(p, 'f03'), 'f03');
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

console.log('\n✅ Все тесты фазы 59 (userbot_inline_query) пройдены!\n');
