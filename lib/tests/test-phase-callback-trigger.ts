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
