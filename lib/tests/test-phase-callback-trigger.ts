/**
 * @fileoverview Интеграционные тесты для узла callback_trigger
 *
 * Блок A: Базовая генерация (exact, startswith)
 * Блок B: adminOnly, requiresAuth
 * Блок C: Синтаксис Python
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Создаёт минимальный проект с заданными узлами */
function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код для проекта
 * @param project - Объект проекта
 * @param label - Метка для имени бота
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `PhaseCallback_${label}`, userDatabaseEnabled: false, enableComments: false });
}

/**
 * Проверяет синтаксис Python-кода
 * @param code - Python-код для проверки
 * @param label - Метка для временного файла
 * @returns Результат проверки
 */
function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_pcb_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try { execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' }); fs.unlinkSync(tmp); return { ok: true }; }
  catch (e: any) { try { fs.unlinkSync(tmp); } catch {} return { ok: false, error: e.stderr?.toString() ?? String(e) }; }
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/** Запускает тест и записывает результат */
function test(id: string, name: string, fn: () => void) {
  try { fn(); results.push({ id, name, passed: true, note: 'OK' }); console.log(`  ✅ ${id}. ${name}`); }
  catch (e: any) { results.push({ id, name, passed: false, note: e.message }); console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`); }
}

/** Проверяет условие, бросает ошибку если не выполнено */
function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

/** Проверяет синтаксис Python, бросает ошибку при неверном синтаксисе */
function syntax(code: string, label: string) { const r = checkSyntax(code, label); ok(r.ok, `Синтаксическая ошибка:\n${r.error}`); }

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/**
 * Создаёт узел callback_trigger
 * @param id - ID узла
 * @param callbackData - Значение callback_data
 * @param matchType - Режим совпадения
 * @param targetId - ID целевого узла
 * @param opts - Дополнительные опции
 */
function makeCallbackTriggerNode(id: string, callbackData: string, matchType: 'exact' | 'startswith', targetId: string, opts: {
  adminOnly?: boolean;
  requiresAuth?: boolean;
} = {}) {
  return {
    id,
    type: 'callback_trigger',
    position: { x: 0, y: 0 },
    data: {
      callbackData,
      matchType,
      adminOnly: opts.adminOnly ?? false,
      requiresAuth: opts.requiresAuth ?? false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/**
 * Создаёт message-узел
 * @param id - ID узла
 * @param text - Текст сообщения
 */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза — Узел callback_trigger                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'exact → генерирует lambda c: c.data == "..."', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('lambda c: c.data == "confirm_order"'), 'lambda c: c.data == "confirm_order" должен быть в коде');
});

test('A02', 'startswith → генерирует lambda c: c.data and c.data.startswith("...")', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'order_', 'startswith', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('c.data.startswith("order_")'), 'c.data.startswith("order_") должен быть в коде');
  ok(code.includes('c.data and'), 'c.data and должен быть в коде');
});

test('A03', 'имя функции содержит nodeId → callback_trigger_<id>_handler', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('mynode', 'btn_click', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('callback_trigger_mynode_handler'), 'callback_trigger_mynode_handler должен быть в коде');
});

test('A04', 'содержит class MockCallback:', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('A05', 'содержит mock_callback = MockCallback', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('mock_callback = MockCallback('), 'mock_callback = MockCallback( должен быть в коде');
});

test('A06', 'содержит await handle_callback_<targetId>(mock_callback)', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'await handle_callback_msg1(mock_callback) должен быть в коде');
});

test('A07', 'содержит logging.info с user_id', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
  ok(code.includes('user_id'), 'user_id должен упоминаться');
});

test('A08', 'без autoTransitionTo → триггер игнорируется', () => {
  const trigger = makeCallbackTriggerNode('t1', 'confirm', 'exact', '');
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'a08');
  ok(!code.includes('callback_trigger_t1_handler'), 'обработчик НЕ должен генерироваться без autoTransitionTo');
});

test('A09', 'два триггера → два @dp.callback_query', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'),
    makeCallbackTriggerNode('t2', 'cancel_', 'startswith', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a09');
  const count = (code.match(/@dp\.callback_query\(/g) || []).length;
  ok(count >= 2, `Должно быть минимум 2 @dp.callback_query, найдено: ${count}`);
});

test('A10', 'callback_query.from_user.id используется для user_id', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a10');
  ok(code.includes('callback_query.from_user.id'), 'callback_query.from_user.id должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: adminOnly, requiresAuth
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: adminOnly, requiresAuth ───────────────────────────────');

test('B01', 'adminOnly: true → есть is_admin(user_id)', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'admin_action', 'exact', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('is_admin(user_id)'), 'is_admin(user_id) должен быть в коде');
});

test('B02', 'adminOnly: true → есть сообщение об отсутствии прав', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'admin_action', 'exact', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('нет прав'), 'сообщение об отсутствии прав должно быть в коде');
});

test('B03', 'adminOnly: false → нет is_admin(', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'action', 'exact', 'msg1', { adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  ok(!code.includes('is_admin('), 'is_admin( НЕ должен быть в коде');
});

test('B04', 'requiresAuth: true → есть check_auth(user_id)', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'view_profile', 'exact', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b04');
  ok(code.includes('check_auth(user_id)'), 'check_auth(user_id) должен быть в коде');
});

test('B05', 'requiresAuth: false → нет check_auth( в обработчике', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'action', 'exact', 'msg1', { requiresAuth: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'b05');
  const handlerIdx = code.indexOf('callback_trigger_t1_handler');
  const nextHandlerIdx = code.indexOf('async def ', handlerIdx + 1);
  const handlerBody = nextHandlerIdx > 0 ? code.substring(handlerIdx, nextHandlerIdx) : code.substring(handlerIdx);
  ok(!handlerBody.includes('not await check_auth(user_id)'), 'вызов check_auth НЕ должен быть в обработчике');
});

test('B06', 'adminOnly: true + requiresAuth: true → обе проверки есть', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'action', 'exact', 'msg1', { adminOnly: true, requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'b06');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Синтаксис Python
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Синтаксис Python ──────────────────────────────────────');

test('C01', 'exact → синтаксис Python OK', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'c01'), 'c01');
});

test('C02', 'startswith → синтаксис Python OK', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'order_', 'startswith', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'c02'), 'c02');
});

test('C03', 'adminOnly: true → синтаксис Python OK', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'action', 'exact', 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'c03'), 'c03');
});

test('C04', 'requiresAuth: true → синтаксис Python OK', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'action', 'exact', 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'c04'), 'c04');
});

test('C05', 'несколько триггеров → синтаксис Python OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg1'),
    makeCallbackTriggerNode('t2', 'cancel_', 'startswith', 'msg1'),
    makeCallbackTriggerNode('t3', 'action', 'exact', 'msg1', { adminOnly: true }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c05'), 'c05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Переменные callback_data и button_text
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Переменные callback_data и button_text ────────────────');

test('D01', 'сгенерированный код содержит user_data[user_id]["callback_data"]', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'd01');
  ok(code.includes('user_data[user_id]["callback_data"]'), 'user_data[user_id]["callback_data"] должен быть в коде');
});

test('D02', 'сгенерированный код содержит user_data[user_id]["button_text"]', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'd02');
  ok(code.includes('user_data[user_id]["button_text"]'), 'user_data[user_id]["button_text"] должен быть в коде');
});

test('D03', 'синтаксис Python OK с новыми переменными', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1', 'Вы нажали: {callback_data}')]);
  syntax(gen(p, 'd03'), 'd03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Переменные callback_data и button_text от инлайн-кнопок клавиатуры
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: callback_data и button_text от инлайн-кнопок ──────────');

/**
 * Создаёт message-узел с инлайн-кнопками
 * @param id - ID узла
 * @param text - Текст сообщения
 * @param buttons - Кнопки
 * @returns Объект узла типа message с инлайн-клавиатурой
 */
function makeMessageNodeWithButtons(id: string, text: string, buttons: any[]) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: { messageText: text, buttons, keyboardType: 'inline', formatMode: 'none', markdown: false },
  };
}

test('E01', 'message с инлайн-кнопкой → содержит user_data[user_id]["callback_data"]', () => {
  const p = makeCleanProject([makeMessageNodeWithButtons('msg1', 'Выберите:', [
    { id: 'btn1', text: 'Подтвердить', action: 'goto', target: 'msg2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
  ]), makeMessageNode('msg2')]);
  const code = gen(p, 'e01');
  ok(code.includes('user_data[user_id]["callback_data"]'), 'user_data[user_id]["callback_data"] должен быть в коде');
});

test('E02', 'message с инлайн-кнопкой → содержит user_data[user_id]["button_text"]', () => {
  const p = makeCleanProject([makeMessageNodeWithButtons('msg1', 'Выберите:', [
    { id: 'btn1', text: 'Подтвердить', action: 'goto', target: 'msg2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
  ]), makeMessageNode('msg2')]);
  const code = gen(p, 'e02');
  ok(code.includes('user_data[user_id]["button_text"]'), 'user_data[user_id]["button_text"] должен быть в коде');
});

test('E03', 'синтаксис Python OK с инлайн-кнопками и переменными', () => {
  const p = makeCleanProject([
    makeMessageNodeWithButtons('msg1', 'Выберите:', [
      { id: 'btn1', text: 'Подтвердить', action: 'goto', target: 'msg2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Отмена', action: 'goto', target: 'msg2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg2', 'Вы нажали: {button_text}'),
  ]);
  syntax(gen(p, 'e03'), 'e03');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Рантайм-чтение button_text из reply_markup
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Рантайм-чтение button_text из reply_markup ────────────');

/**
 * F01: Проверяет наличие чтения из reply_markup в сгенерированном коде
 */
test('F01', 'callback_trigger → содержит чтение из reply_markup', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f01');
  ok(code.includes('reply_markup'), 'reply_markup должен быть в коде');
  ok(code.includes('inline_keyboard'), 'inline_keyboard должен быть в коде');
});

/**
 * F02: Проверяет наличие try/except вокруг чтения reply_markup
 */
test('F02', 'callback_trigger → содержит try/except вокруг чтения reply_markup', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'confirm_order', 'exact', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f02');
  ok(code.includes('except Exception:'), 'except Exception: должен быть в коде');
});

/**
 * F03: Проверяет наличие _btn_text_found в message-узле с инлайн-кнопками
 */
test('F03', 'message с инлайн-кнопками → содержит _btn_text_found', () => {
  const p = makeCleanProject([makeMessageNodeWithButtons('msg1', 'Выберите:', [
    { id: 'btn1', text: 'Да', action: 'goto', target: 'msg2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
  ]), makeMessageNode('msg2')]);
  const code = gen(p, 'f03');
  ok(code.includes('_btn_text_found'), '_btn_text_found должен быть в коде');
});

/**
 * F04: Проверяет наличие чтения из reply_markup в message-узле с инлайн-кнопками
 */
test('F04', 'message с инлайн-кнопками → содержит чтение из reply_markup', () => {
  const p = makeCleanProject([makeMessageNodeWithButtons('msg1', 'Выберите:', [
    { id: 'btn1', text: 'Да', action: 'goto', target: 'msg2', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
  ]), makeMessageNode('msg2')]);
  const code = gen(p, 'f04');
  ok(code.includes('reply_markup'), 'reply_markup должен быть в коде');
  ok(code.includes('inline_keyboard'), 'inline_keyboard должен быть в коде');
});

/**
 * F05: Сложный сценарий — callback_trigger + инлайн-кнопки + переменные в тексте
 */
test('F05', 'сложный сценарий: callback_trigger + инлайн-кнопки + переменные в тексте → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('t1', 'confirm', 'exact', 'msg_with_btns'),
    makeMessageNodeWithButtons('msg_with_btns', 'Выберите действие:', [
      { id: 'btn1', text: 'Продолжить', action: 'goto', target: 'msg_final', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Отмена', action: 'goto', target: 'msg_final', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_final', 'Триггер: {callback_data}, кнопка: {button_text}'),
  ]);
  syntax(gen(p, 'f05'), 'f05');
});

/**
 * F06: Два callback_trigger — каждый должен иметь свой блок reply_markup
 */
test('F06', 'сложный сценарий: два callback_trigger → каждый имеет свой блок reply_markup', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('t1', 'action_a', 'exact', 'msg1'),
    makeCallbackTriggerNode('t2', 'action_b', 'exact', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f06');
  // Каждый callback_trigger должен иметь свой _cb_btn_text
  const count = (code.match(/_cb_btn_text/g) || []).length;
  ok(count >= 2, `Должно быть минимум 2 вхождения _cb_btn_text, найдено: ${count}`);
});

/**
 * F07: startswith триггер — должен содержать рантайм-чтение reply_markup
 */
test('F07', 'startswith триггер → содержит рантайм-чтение reply_markup', () => {
  const p = makeCleanProject([makeCallbackTriggerNode('t1', 'order_', 'startswith', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f07');
  ok(code.includes('_cb_btn_text'), '_cb_btn_text должен быть в коде для startswith триггера');
  ok(code.includes('reply_markup'), 'reply_markup должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Регрессия — обработчик слушает nodeId даже при наличии callbackPattern
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Регрессия — nodeId в декораторе при callbackPattern ───');

/**
 * Создаёт message-узел с инлайн-кнопками, одна из которых имеет customCallbackData
 * @param id - ID узла
 * @param text - Текст сообщения
 * @param targetId - ID целевой ноды
 * @returns Объект узла типа message со смешанными кнопками
 */
function makeMessageWithMixedButtons(id: string, text: string, targetId: string) {
  return {
    id,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: text,
      buttons: [
        // Кнопка 1 с customCallbackData — задаёт callbackPattern для целевой ноды
        {
          id: 'btn_custom',
          text: 'Кнопка с custom',
          action: 'goto',
          target: targetId,
          customCallbackData: 'my_custom_cb',
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
        // Кнопка 2 без customCallbackData — её callback_data = nodeId целевой ноды
        {
          id: 'btn_plain',
          text: 'Кнопка без custom',
          action: 'goto',
          target: targetId,
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false,
        },
      ],
      keyboardType: 'inline',
      formatMode: 'none',
      markdown: false,
    },
  };
}

test('G01', 'обработчик целевой ноды слушает nodeId даже если задан callbackPattern', () => {
  const p = makeCleanProject([
    makeMessageWithMixedButtons('msg_src', 'Выберите:', 'msg_target'),
    makeMessageNode('msg_target', 'Ответ: {button_text}'),
  ]);
  const code = gen(p, 'g01');
  // Обработчик должен слушать и customCallbackData и nodeId
  ok(code.includes('"my_custom_cb"'), 'customCallbackData должен быть в декораторе');
  ok(code.includes('"msg_target"'), 'nodeId должен быть в декораторе');
});

test('G02', 'без customCallbackData декоратор слушает только nodeId', () => {
  const p = makeCleanProject([
    makeMessageNodeWithButtons('msg_src', 'Выберите:', [
      { id: 'btn1', text: 'Кнопка', action: 'goto', target: 'msg_target', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_target', 'Ответ'),
  ]);
  const code = gen(p, 'g02');
  // Без customCallbackData — только nodeId
  ok(code.includes('"msg_target"'), 'nodeId должен быть в декораторе');
});

test('G03', 'синтаксис Python OK при смешанных кнопках', () => {
  const p = makeCleanProject([
    makeMessageWithMixedButtons('msg_src', 'Выберите:', 'msg_target'),
    makeMessageNode('msg_target', 'Ответ: {callback_data} {button_text}'),
  ]);
  syntax(gen(p, 'g03'), 'g03');
});

test('G04', 'несколько нод с разными callbackPattern — каждая слушает свой nodeId', () => {
  const p = makeCleanProject([
    makeMessageWithMixedButtons('msg_src', 'Выберите:', 'msg_a'),
    makeMessageWithMixedButtons('msg_src2', 'Выберите 2:', 'msg_b'),
    makeMessageNode('msg_a', 'Ответ A'),
    makeMessageNode('msg_b', 'Ответ B'),
  ]);
  const code = gen(p, 'g04');
  ok(code.includes('"msg_a"'), 'msg_a должен быть в декораторе');
  ok(code.includes('"msg_b"'), 'msg_b должен быть в декораторе');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Виртуальные callback_trigger из customCallbackData кнопок
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Виртуальные callback_trigger из customCallbackData ────');

/**
 * Создаёт message-узел с двумя кнопками с разными customCallbackData к одной ноде
 * @param srcId - ID исходного узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа message с двумя кнопками customCallbackData
 */
function makeMessageWithTwoCustomCallbacks(srcId: string, targetId: string) {
  return {
    id: srcId,
    type: 'message',
    position: { x: 0, y: 0 },
    data: {
      messageText: 'Выберите:',
      keyboardType: 'inline',
      buttons: [
        { id: 'btn_yes', text: 'Да', action: 'goto', target: targetId, customCallbackData: 'yes', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
        { id: 'btn_no', text: 'Нет', action: 'goto', target: targetId, customCallbackData: 'no', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      ],
      formatMode: 'none',
      markdown: false,
    },
  };
}

test('H01', 'кнопки с customCallbackData → генерируются виртуальные обработчики', () => {
  const p = makeCleanProject([
    makeMessageWithTwoCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {button_text}'),
  ]);
  const code = gen(p, 'h01');
  ok(code.includes('lambda c: c.data == "yes"'), 'обработчик для "yes" должен быть в коде');
  ok(code.includes('lambda c: c.data == "no"'), 'обработчик для "no" должен быть в коде');
});

test('H02', 'виртуальные обработчики вызывают handle_callback целевой ноды', () => {
  const p = makeCleanProject([
    makeMessageWithTwoCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ'),
  ]);
  const code = gen(p, 'h02');
  ok(code.includes('await handle_callback_msg_answer('), 'вызов handle_callback_msg_answer должен быть в коде');
});

test('H03', 'декоратор handle_callback_msg_answer слушает только nodeId (не customCallbackData)', () => {
  const p = makeCleanProject([
    makeMessageWithTwoCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ'),
  ]);
  const code = gen(p, 'h03');
  /** Декоратор handle_callback_msg_answer должен слушать только "msg_answer" */
  const handlerIdx = code.indexOf('async def handle_callback_msg_answer');
  const decoratorLine = code.substring(code.lastIndexOf('@dp.callback_query', handlerIdx), handlerIdx);
  ok(decoratorLine.includes('"msg_answer"'), 'декоратор должен содержать nodeId');
  ok(!decoratorLine.includes('"yes"'), 'декоратор НЕ должен содержать customCallbackData "yes"');
  ok(!decoratorLine.includes('"no"'), 'декоратор НЕ должен содержать customCallbackData "no"');
});

test('H04', 'синтаксис Python OK с виртуальными триггерами', () => {
  const p = makeCleanProject([
    makeMessageWithTwoCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {callback_data} — {button_text}'),
  ]);
  syntax(gen(p, 'h04'), 'h04');
});

test('H05', 'явный callback_trigger имеет приоритет — нет дублирования обработчиков', () => {
  const p = makeCleanProject([
    makeCallbackTriggerNode('explicit', 'yes', 'exact', 'msg_answer'),
    makeMessageWithTwoCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ'),
  ]);
  const code = gen(p, 'h05');
  /** Должен быть только один обработчик для "yes" */
  const count = (code.match(/lambda c: c\.data == "yes"/g) || []).length;
  ok(count === 1, `Должен быть ровно 1 обработчик для "yes", найдено: ${count}`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Базовая генерация middleware incoming_callback_trigger
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Базовая генерация incoming_callback_trigger ───────────');

/**
 * Создаёт узел incoming_callback_trigger
 * @param id - ID узла
 * @param targetId - ID целевого узла
 * @returns Объект узла типа incoming_callback_trigger
 */
function makeIncomingCallbackTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_callback_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

test('I01', 'incoming_callback_trigger → генерирует dp.callback_query.middleware', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i01');
  ok(code.includes('dp.callback_query.middleware'), 'dp.callback_query.middleware должен быть в коде');
});

test('I02', 'имя middleware содержит nodeId', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict_abc', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i02');
  ok(code.includes('incoming_callback_trigger_ict_abc_middleware'), 'имя middleware должно содержать nodeId');
});

test('I03', 'middleware содержит return await handler(event, data)', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i03');
  ok(code.includes('return await handler(event, data)'), 'return await handler(event, data) должен быть в коде');
});

test('I04', 'middleware содержит MockCallback', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i04');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
  ok(code.includes('mock_callback = MockCallback('), 'mock_callback = MockCallback( должен быть в коде');
});

test('I05', 'middleware вызывает handle_callback_<targetId>', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'i05');
  ok(code.includes('await handle_callback_msg_target(mock_callback)'), 'вызов handle_callback_msg_target должен быть в коде');
});

test('I06', 'middleware содержит logging.info с user_id', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i06');
  ok(code.includes('logging.info'), 'logging.info должен быть в коде');
  ok(code.includes('user_id'), 'user_id должен упоминаться');
});

test('I07', 'middleware содержит logging.error для исключений', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i07');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
});

test('I08', 'без autoTransitionTo → middleware не генерируется', () => {
  const trigger = { id: 'ict_bad', type: 'incoming_callback_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: '', buttons: [], keyboardType: 'none' } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'i08');
  ok(!code.includes('incoming_callback_trigger_ict_bad_middleware'), 'middleware НЕ должен генерироваться без autoTransitionTo');
});

test('I09', 'два триггера → два middleware', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'i09');
  ok(code.includes('incoming_callback_trigger_ict1_middleware'), 'первый middleware должен быть в коде');
  ok(code.includes('incoming_callback_trigger_ict2_middleware'), 'второй middleware должен быть в коде');
});

test('I10', 'middleware содержит event.from_user.id', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i10');
  ok(code.includes('event.from_user.id'), 'event.from_user.id должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Сохранение переменных callback_data и button_text
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Сохранение callback_data и button_text ────────────────');

test('J01', 'middleware сохраняет user_data[user_id]["callback_data"]', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j01');
  ok(code.includes('user_data[user_id]["callback_data"]'), 'user_data[user_id]["callback_data"] должен быть в коде');
});

test('J02', 'middleware сохраняет user_data[user_id]["button_text"]', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j02');
  ok(code.includes('user_data[user_id]["button_text"]'), 'user_data[user_id]["button_text"] должен быть в коде');
});

test('J03', 'middleware читает reply_markup для button_text', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j03');
  ok(code.includes('reply_markup'), 'reply_markup должен быть в коде');
  ok(code.includes('inline_keyboard'), 'inline_keyboard должен быть в коде');
});

test('J04', 'middleware содержит _ict_btn_text', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j04');
  ok(code.includes('_ict_btn_text'), '_ict_btn_text должен быть в коде');
});

test('J05', 'middleware содержит inline_keyboard', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j05');
  ok(code.includes('inline_keyboard'), 'inline_keyboard должен быть в коде');
});

test('J06', 'middleware содержит try/except вокруг чтения reply_markup', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j06');
  ok(code.includes('except Exception:'), 'except Exception: должен быть в коде');
});

test('J07', 'синтаксис Python OK с переменными callback_data и button_text', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Нажали: {callback_data}, кнопка: {button_text}'),
  ]);
  syntax(gen(p, 'j07'), 'j07');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Регистрация middleware
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Регистрация middleware ────────────────────────────────');

test('K01', 'содержит dp.callback_query.middleware(...)', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k01');
  ok(code.includes('dp.callback_query.middleware(incoming_callback_trigger_ict1_middleware)'), 'регистрация middleware должна быть в коде');
});

test('K02', 'имя функции в middleware совпадает с именем в регистрации', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict_xyz', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k02');
  const fnName = 'incoming_callback_trigger_ict_xyz_middleware';
  ok(code.includes(`async def ${fnName}`), `async def ${fnName} должен быть в коде`);
  ok(code.includes(`dp.callback_query.middleware(${fnName})`), `регистрация ${fnName} должна быть в коде`);
});

test('K03', 'два триггера → два вызова dp.callback_query.middleware', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k03');
  const count = (code.match(/dp\.callback_query\.middleware\(/g) || []).length;
  ok(count >= 2, `Должно быть минимум 2 вызова dp.callback_query.middleware, найдено: ${count}`);
});

test('K04', 'синтаксис Python OK при регистрации middleware', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'k04'), 'k04');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Взаимодействие с другими триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Взаимодействие с другими триггерами ───────────────────');

test('L01', 'incoming_callback_trigger + callback_trigger → оба генерируются', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'confirm', 'exact', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'l01');
  ok(code.includes('dp.callback_query.middleware'), 'middleware должен быть в коде');
  ok(code.includes('callback_trigger_ct1_handler'), 'callback_trigger обработчик должен быть в коде');
});

test('L02', 'incoming_callback_trigger + incoming_message_trigger → оба генерируются', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'imt1', type: 'incoming_message_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: 'msg1' } },
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'l02');
  ok(code.includes('dp.callback_query.middleware'), 'callback middleware должен быть в коде');
  ok(code.includes('dp.message.middleware'), 'message middleware должен быть в коде');
});

test('L03', 'incoming_callback_trigger + инлайн-кнопки → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_btns'),
    makeMessageNodeWithButtons('msg_btns', 'Выберите:', [
      { id: 'btn1', text: 'Да', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_end', 'Готово'),
  ]);
  syntax(gen(p, 'l03'), 'l03');
});

test('L04', 'incoming_callback_trigger + виртуальные триггеры → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_answer'),
    makeMessageWithTwoCustomCallbacks('msg_src', 'msg_answer'),
    makeMessageNode('msg_answer', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'l04'), 'l04');
});

test('L05', 'сложный сценарий: все типы триггеров вместе → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'confirm', 'exact', 'msg1'),
    { id: 'imt1', type: 'incoming_message_trigger', position: { x: 0, y: 0 }, data: { autoTransitionTo: 'msg1' } },
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeMessageNode('msg1', 'Ответ: {callback_data} {button_text}'),
  ]);
  syntax(gen(p, 'l05'), 'l05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Синтаксис Python
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Синтаксис Python ──────────────────────────────────────');

test('M01', 'один incoming_callback_trigger → синтаксис Python OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'm01'), 'm01');
});

test('M02', 'два incoming_callback_trigger → синтаксис Python OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict2', 'msg2'),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]);
  syntax(gen(p, 'm02'), 'm02');
});

test('M03', 'incoming_callback_trigger с дефисами в nodeId → синтаксис Python OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict-node-1', 'msg-target-1'), makeMessageNode('msg-target-1')]);
  syntax(gen(p, 'm03'), 'm03');
});

test('M04', 'incoming_callback_trigger → message с форматированием → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: '<b>Привет</b>', buttons: [], keyboardType: 'none', formatMode: 'html' } },
  ]);
  syntax(gen(p, 'm04'), 'm04');
});

test('M05', 'incoming_callback_trigger → message с markdown → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    { id: 'msg1', type: 'message', position: { x: 0, y: 0 }, data: { messageText: '*Привет*', buttons: [], keyboardType: 'none', formatMode: 'markdown' } },
  ]);
  syntax(gen(p, 'm05'), 'm05');
});

test('M06', 'три incoming_callback_trigger к одной ноде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeIncomingCallbackTriggerNode('ict2', 'msg1'),
    makeIncomingCallbackTriggerNode('ict3', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'm06'), 'm06');
});

test('M07', 'incoming_callback_trigger без других узлов → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingCallbackTriggerNode('ict1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'm07'), 'm07');
});

test('M08', 'incoming_callback_trigger + start + message → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Старт', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'm08'), 'm08');
});

test('M09', 'incoming_callback_trigger → message с инлайн-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_btns'),
    makeMessageNodeWithButtons('msg_btns', 'Выберите:', [
      { id: 'btn1', text: 'Вариант 1', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Вариант 2', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_end', 'Выбрано: {button_text}'),
  ]);
  syntax(gen(p, 'm09'), 'm09');
});

test('M10', 'incoming_callback_trigger + callback_trigger + message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeCallbackTriggerNode('ct1', 'action', 'exact', 'msg1'),
    makeMessageNode('msg1', 'Ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'm10'), 'm10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Сложные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Сложные сценарии ──────────────────────────────────────');

test('N01', 'incoming_callback_trigger → message с {callback_data} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Вы нажали кнопку: {callback_data}'),
  ]);
  syntax(gen(p, 'n01'), 'n01');
});

test('N02', 'incoming_callback_trigger → message с {button_text} → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Текст кнопки: {button_text}'),
  ]);
  syntax(gen(p, 'n02'), 'n02');
});

test('N03', 'incoming_callback_trigger → condition → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'cond1'),
    {
      id: 'cond1', type: 'condition', position: { x: 0, y: 0 },
      data: {
        variable: 'callback_data', operator: 'equals', value: 'yes',
        trueNodeId: 'msg_yes', falseNodeId: 'msg_no',
      },
    },
    makeMessageNode('msg_yes', 'Да!'),
    makeMessageNode('msg_no', 'Нет!'),
  ]);
  syntax(gen(p, 'n03'), 'n03');
});

test('N04', 'incoming_callback_trigger → message с инлайн-кнопками → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Меню:', [
      { id: 'btn1', text: 'Пункт 1', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Пункт 2', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn3', text: 'Пункт 3', action: 'goto', target: 'msg_end', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_end', 'Выбрано: {button_text}'),
  ]);
  syntax(gen(p, 'n04'), 'n04');
});

test('N05', 'несколько incoming_callback_trigger к разным нодам → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_a'),
    makeIncomingCallbackTriggerNode('ict2', 'msg_b'),
    makeIncomingCallbackTriggerNode('ict3', 'msg_c'),
    makeMessageNode('msg_a', 'Ответ A: {callback_data}'),
    makeMessageNode('msg_b', 'Ответ B: {button_text}'),
    makeMessageNode('msg_c', 'Ответ C'),
  ]);
  syntax(gen(p, 'n05'), 'n05');
});

test('N06', 'incoming_callback_trigger + callback_trigger к одной ноде → синтаксис OK', () => {
  const p = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg_shared'),
    makeCallbackTriggerNode('ct1', 'specific_action', 'exact', 'msg_shared'),
    makeMessageNode('msg_shared', 'Общий ответ: {callback_data}'),
  ]);
  syntax(gen(p, 'n06'), 'n06');
});

test('N07', 'полный проект (start + message + keyboard + incoming_callback_trigger) → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Добро пожаловать!', buttons: [], keyboardType: 'none', formatMode: 'none' } },
    makeIncomingCallbackTriggerNode('ict1', 'msg_menu'),
    makeMessageNodeWithButtons('msg_menu', 'Главное меню:', [
      { id: 'btn1', text: 'Профиль', action: 'goto', target: 'msg_profile', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
      { id: 'btn2', text: 'Настройки', action: 'goto', target: 'msg_settings', buttonType: 'normal', skipDataCollection: false, hideAfterClick: false },
    ]),
    makeMessageNode('msg_profile', 'Ваш профиль. Нажали: {button_text}'),
    makeMessageNode('msg_settings', 'Настройки. Нажали: {button_text}'),
  ]);
  syntax(gen(p, 'n07'), 'n07');
});

test('N08', 'incoming_callback_trigger → message с userDatabaseEnabled: true → синтаксис OK', () => {
  const project = makeCleanProject([
    makeIncomingCallbackTriggerNode('ict1', 'msg1'),
    makeMessageNode('msg1', 'Привет, {callback_data}!'),
  ]);
  const code = generatePythonCode(project as any, { botName: 'PhaseCallback_n08', userDatabaseEnabled: true, enableComments: false });
  const r = checkSyntax(code, 'n08');
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итого: ${passed} пройдено, ${failed} провалено из ${results.length}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}. ${r.name}\n     → ${r.note}`));
  process.exit(1);
}
