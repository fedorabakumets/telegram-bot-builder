/**
 * @fileoverview Интеграционные тесты для узла userbot_click_button (фаза 58)
 *
 * Блок A: Базовая генерация
 * Блок B: Режимы поиска кнопки
 * Блок C: Сохранение переменных
 * Блок D: get_content и переменные
 * Блок E: Автопереход и ошибки
 * Блок F: Сценарий парсинга бота
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
  return generatePythonCode(project as any, { botName: `Phase58_${label}`, userDatabaseEnabled: true, enableComments: false, projectId: 1 });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p58_${label}.py`;
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

/** Создаёт узел userbot_click_button */
function makeUserbotClickButtonNode(id: string, opts: any = {}) {
  return {
    id, type: 'userbot_click_button' as any, position: { x: 0, y: 0 },
    data: {
      userbotEntity: opts.userbotEntity || '@bot',
      messageId: opts.messageId || '123',
      clickMode: opts.clickMode || 'text',
      clickDelivery: opts.clickDelivery || 'fire_and_forget',
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

/** Создаёт message-узел */
function makeMessageNode(id: string, text = 'test') {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

/** Создаёт command_trigger узел */
function makeCommandTrigger(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: cmd, autoTransitionTo: target, enableAutoTransition: true, description: '', showInMenu: true, adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } };
}

/** Создаёт bot_table узел */
function makeBotTableNode(id: string, opts: any = {}) {
  return { id, type: 'bot_table' as any, position: { x: 0, y: 0 }, data: { tableName: opts.tableName || 'data', operation: opts.operation || 'insert', columns: opts.columns || [], autoTransitionTo: opts.autoTransitionTo || '', enableAutoTransition: !!opts.autoTransitionTo } };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 58 — Узел userbot_click_button                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'userbot_click_button → генерируется handle_callback_', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_ucb1'), 'handle_callback_ucb1 должен быть в коде');
});

test('A02', 'содержит userbot_client.get_messages', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'a02');
  ok(code.includes('userbot_client.get_messages'), 'userbot_client.get_messages должен быть в коде');
});

test('A03', 'содержит _msg.click', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'a03');
  ok(code.includes('_msg.click'), '_msg.click должен быть в коде');
});

test('A04', 'содержит @dp.callback_query с nodeId', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'a04');
  ok(code.includes('"ucb1"'), 'callback_query с "ucb1" должен быть в коде');
});

test('A05', 'содержит logging.info с "click_button"', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'a05');
  ok(code.includes('logging.info') && code.includes('click_button'), 'logging.info с "click_button" должен быть в коде');
});

test('A06', 'синтаксис Python OK (базовый userbot_click_button)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ucb1'),
    makeUserbotClickButtonNode('ucb1'),
  ]);
  syntax(gen(p, 'a06'), 'a06');
});

test('A07', 'содержит Telethon импорт и StringSession', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'a07');
  ok(code.includes('from telethon') || code.includes('TelegramClient'), 'Импорт Telethon должен быть в коде');
  ok(code.includes('StringSession'), 'StringSession должен быть в коде');
});

test('A08', 'clickDelivery=await → await dispatch callback с timeout 2с', () => {
  const p = makeCleanProject([
    makeUserbotClickButtonNode('ucb_await', {
      clickDelivery: 'await',
      clickValue: 'Карта',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a08');
  ok(code.includes('await _dispatch_callback_click_'), 'callback await должен выполняться до ожидания edit');
  ok(code.includes('timeout=2.0'), 'короткий таймаут answerCallbackQuery');
  ok(
    code.includes('# await:') || code.includes('[await]'),
    'маркер await-режима (# await: или [await]) должен быть в коде',
  );
  ok(code.includes('автопереход') && code.includes('отменён'), 'без ответа бота автопереход отменяется');
  syntax(code, 'a08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Режимы поиска кнопки
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Режимы поиска кнопки ──────────────────────────────────');

test('B01', 'clickMode=text → msg.click(text=...)', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { clickMode: 'text', clickValue: 'Играть' })]);
  const code = gen(p, 'b01');
  ok(code.includes('msg.click(text=') || code.includes('_msg.click(text='), 'msg.click(text=...) должен быть в коде');
});

test('B02', 'clickMode=data → поиск по callback_data + GetBotCallbackAnswerRequest', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { clickMode: 'data', clickValue: 'play_game' })]);
  const code = gen(p, 'b02');
  ok(
    code.includes("_click_val.encode('utf-8') in _btn.data"),
    'поиск кнопки по callback_data должен быть в коде',
  );
  ok(code.includes('GetBotCallbackAnswerRequest'), 'GetBotCallbackAnswerRequest должен быть в коде');
});

test('B03', 'clickMode=index → _idx_parts и msg.click(row, col)', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { clickMode: 'index', clickValue: '0,1' })]);
  const code = gen(p, 'b03');
  ok(code.includes('_idx_parts'), '_idx_parts должен быть в коде');
  ok(code.includes('_msg.click(') || code.includes('msg.click('), 'msg.click с индексами должен быть в коде');
});

test('B04', 'синтаксис OK (все три режима)', () => {
  const nodes = [
    makeCommandTrigger('cmd1', '/start', 'ucb_text'),
    makeUserbotClickButtonNode('ucb_text', { clickMode: 'text', clickValue: 'Кнопка' }),
    makeUserbotClickButtonNode('ucb_data', { clickMode: 'data', clickValue: 'cb_data' }),
    makeUserbotClickButtonNode('ucb_idx', { clickMode: 'index', clickValue: '1,0' }),
  ];
  const p = makeCleanProject(nodes);
  syntax(gen(p, 'b04'), 'b04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Сохранение переменных
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Сохранение переменных ─────────────────────────────────');

test('C01', 'saveAlertTo → содержит set_user_var с именем переменной', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveAlertTo: 'alert_text' })]);
  const code = gen(p, 'c01');
  ok(code.includes('set_user_var') && code.includes('alert_text'), 'set_user_var с "alert_text" должен быть в коде');
});

test('C02', 'saveResultTo → содержит _updated.text', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveResultTo: 'result_text' })]);
  const code = gen(p, 'c02');
  ok(code.includes('_updated.text') || code.includes('_updated.text'), '_updated.text должен быть в коде');
});

test('C03', 'saveButtonsTo → содержит json.dumps', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveButtonsTo: 'buttons_json' })]);
  const code = gen(p, 'c03');
  ok(code.includes('json.dumps') || code.includes('_json.dumps'), 'json.dumps должен быть в коде');
});

test('C04', 'saveHasMediaTo → содержит "true" и "false"', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveHasMediaTo: 'has_media' })]);
  const code = gen(p, 'c04');
  ok(code.includes('"true"') && code.includes('"false"'), '"true" и "false" должны быть в коде');
});

test('C05', 'saveMediaTo → содержит _updated.media', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveMediaTo: 'media_obj' })]);
  const code = gen(p, 'c05');
  ok(code.includes('_updated.media'), '_updated.media должен быть в коде');
});

test('C06', 'без save-полей → нет set_user_var для них', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'c06');
  const handlerIdx = code.indexOf('handle_callback_ucb1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 3000);
  // Не должно быть set_user_var в обработчике (кроме возможных системных)
  ok(!handlerBlock.includes('set_user_var'), 'set_user_var НЕ должен быть в коде без save-полей');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: get_content и переменные
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: get_content и переменные ──────────────────────────────');

test('D01', 'projectId → get_content для entity', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { userbotEntity: '@target_bot' })]);
  const code = gen(p, 'd01');
  ok(code.includes('get_content') && code.includes('.entity'), 'get_content для entity должен быть в коде');
});

test('D02', 'projectId → get_content для msg_id', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { messageId: '456' })]);
  const code = gen(p, 'd02');
  ok(code.includes('get_content') && code.includes('.msg_id'), 'get_content для msg_id должен быть в коде');
});

test('D03', 'projectId → get_content для click_val', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { clickValue: 'Кнопка' })]);
  const code = gen(p, 'd03');
  ok(code.includes('get_content') && code.includes('.click_val'), 'get_content для click_val должен быть в коде');
});

test('D04', 'без projectId → нет get_content', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = generatePythonCode(p as any, { botName: 'Phase58_d04', userDatabaseEnabled: true, enableComments: false });
  const handlerIdx = code.indexOf('handle_callback_ucb1');
  const handlerBlock = code.substring(handlerIdx, handlerIdx + 3000);
  ok(!handlerBlock.includes('get_content'), 'get_content НЕ должен быть в коде без projectId');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Автопереход и ошибки
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: Автопереход и ошибки ──────────────────────────────────');

test('E01', 'autoTransitionTo → FakeCallbackQuery', () => {
  const p = makeCleanProject([
    makeUserbotClickButtonNode('ucb1', { autoTransitionTo: 'msg1' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e01');
  ok(code.includes('FakeCallbackQuery'), 'FakeCallbackQuery должен быть в коде');
});

test('E02', 'содержит FloodWaitError обработку', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'e02');
  ok(code.includes('FloodWait'), 'FloodWait обработка должна быть в коде');
});

test('E03', 'ожидание ответа через MessageEdited event + fallback истории', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveResultTo: 'res' })]);
  const code = gen(p, 'e03');
  ok(code.includes('events.MessageEdited'), 'MessageEdited handler должен быть в коде');
  ok(
    code.includes('asyncio.wait_for(_edit_future') || code.includes('asyncio.sleep(1)'),
    'ожидание edit (wait_for или sleep fallback) должно быть в коде',
  );
});

test('E04', 'синтаксис OK (полный сценарий с автопереходом)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ucb1'),
    makeUserbotClickButtonNode('ucb1', {
      clickMode: 'text',
      clickValue: 'Играть',
      saveAlertTo: 'alert',
      saveResultTo: 'result',
      saveButtonsTo: 'btns',
      saveHasMediaTo: 'has_m',
      saveMediaTo: 'media',
      autoTransitionTo: 'msg1',
    }),
    makeMessageNode('msg1', 'Готово!'),
  ]);
  syntax(gen(p, 'e04'), 'e04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Сценарий парсинга бота
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Сценарий парсинга бота ────────────────────────────────');

test('F01', 'userbot_message → userbot_click_button → bot_table (синтаксис OK)', () => {
  const p = makeCleanProject([
    makeCommandTrigger('cmd1', '/start', 'ubm1'),
    makeUserbotMessageNode('ubm1', { userbotEntity: '@game_bot', messageText: '/play', autoTransitionTo: 'ucb1' }),
    makeUserbotClickButtonNode('ucb1', {
      userbotEntity: '@game_bot',
      messageId: '{last_msg_id}',
      clickMode: 'text',
      clickValue: 'Играть',
      saveResultTo: 'game_result',
      autoTransitionTo: 'tbl1',
    }),
    makeBotTableNode('tbl1', { tableName: 'games', operation: 'insert', columns: [{ name: 'result', value: '{game_result}' }] }),
  ]);
  syntax(gen(p, 'f01'), 'f01');
});

test('F02', 'несколько userbot_click_button нод → все генерируются', () => {
  const p = makeCleanProject([
    makeUserbotClickButtonNode('ucb1', { clickValue: 'Кнопка 1' }),
    makeUserbotClickButtonNode('ucb2', { clickValue: 'Кнопка 2' }),
    makeUserbotClickButtonNode('ucb3', { clickValue: 'Кнопка 3' }),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('handle_callback_ucb1'), 'handle_callback_ucb1 должен быть в коде');
  ok(code.includes('handle_callback_ucb2'), 'handle_callback_ucb2 должен быть в коде');
  ok(code.includes('handle_callback_ucb3'), 'handle_callback_ucb3 должен быть в коде');
});

test('F03', 'userbot_click_button с saveButtonsTo содержит type в JSON парсинге', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveButtonsTo: 'btns_data' })]);
  const code = gen(p, 'f03');
  ok(code.includes('"type"'), '"type" должен быть в JSON парсинге кнопок');
});

test('F06', 'responseFilterRegex → edit poll с regex (как scrape)', () => {
  const p = makeCleanProject([
    makeUserbotClickButtonNode('ucb1', {
      saveResultTo: 'res',
      clickDelivery: 'await',
    }),
  ]);
  (p.sheets[0].nodes[0].data as Record<string, unknown>).responseFilterRegex = 'сумм|введите';
  (p.sheets[0].nodes[0].data as Record<string, unknown>).responseWaitSeconds = 14;
  const code = gen(p, 'f06');
  ok(code.includes('_re_edit_ok_ucb1'), 'должна быть функция проверки regex edit');
  ok(code.includes('timeout=14'), 'таймаут edit 14 сек');
});

test('F05', 'временный лог кнопок бота до и после клика (по строке на кнопку)', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1')]);
  const code = gen(p, 'f05');
  ok(code.includes('[TEMP ucb1] До клика'), 'должен логировать кнопки до клика');
  ok(code.includes('btn[') && code.includes('] r'), 'каждая кнопка — отдельная строка btn[i] rNcM');
  ok(code.includes('[TEMP ucb1] После ответа'), 'должен логировать кнопки после ответа');
  ok(code.includes('всего'), 'должен логировать итоговое число кнопок');
});

test('F04', 'содержит KeyboardButtonSwitchInline в парсинге типов', () => {
  const p = makeCleanProject([makeUserbotClickButtonNode('ucb1', { saveButtonsTo: 'btns_data' })]);
  const code = gen(p, 'f04');
  ok(code.includes('KeyboardButtonSwitchInline'), 'KeyboardButtonSwitchInline должен быть в парсинге типов');
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

console.log('\n✅ Все тесты фазы 58 (userbot_click_button) пройдены!\n');
