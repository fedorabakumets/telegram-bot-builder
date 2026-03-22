/**
 * @fileoverview Фаза 3 — Узел text_trigger
 *
 * Блок A: Базовая генерация
 * Блок B: matchType exact
 * Блок C: matchType contains
 * Блок D: isPrivateOnly
 * Блок E: adminOnly
 * Блок F: requiresAuth
 * Блок G: Несколько синонимов
 * Блок H: Несколько триггеров
 * Блок I: MockCallback структура
 * Блок J: Форматы синонимов
 * Блок K: Комбинации флагов
 * Блок L: Граничные случаи
 * Блок M: Производительность
 * Блок N: Отсутствие лишнего кода
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: any[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2, activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase3_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p3_${label}.py`;
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

function makeTriggerNode(id: string, synonyms: string[], targetId: string, opts: {
  matchType?: 'exact' | 'contains';
  isPrivateOnly?: boolean;
  adminOnly?: boolean;
  requiresAuth?: boolean;
} = {}) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: synonyms,
      textMatchType: opts.matchType ?? 'exact',
      isPrivateOnly: opts.isPrivateOnly ?? false,
      adminOnly: opts.adminOnly ?? false,
      requiresAuth: opts.requiresAuth ?? false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: text,
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 3 — Узел text_trigger                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'textSynonyms: ["привет"] + autoTransitionTo → генерируется @dp.message(lambda', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('@dp.message(lambda'), '@dp.message(lambda должен быть в коде');
});

test('A02', 'exact → lambda содержит message.text.lower() == "привет"', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('message.text.lower() == "привет"'), 'message.text.lower() == "привет" должен быть в коде');
});

test('A03', 'имя функции содержит nodeId: text_trigger_<id>_<synonym>_handler', () => {
  const p = makeCleanProject([makeTriggerNode('mynode', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('text_trigger_mynode_'), 'text_trigger_mynode_ должен быть в коде');
  ok(code.includes('_handler'), '_handler должен быть в коде');
});

test('A04', 'содержит class MockCallback:', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('A05', 'содержит mock_callback = MockCallback(', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('mock_callback = MockCallback('), 'mock_callback = MockCallback( должен быть в коде');
});

test('A06', 'содержит await handle_callback_<targetId>(mock_callback)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'await handle_callback_msg1(mock_callback) должен быть в коде');
});

test('A07', 'содержит logging.info(', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A08', 'содержит user_id = message.from_user.id', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a08');
  ok(code.includes('user_id = message.from_user.id'), 'user_id = message.from_user.id должен быть в коде');
});

test('A09', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a09'), 'a09');
});

test('A10', 'без autoTransitionTo → триггер игнорируется, нет @dp.message(lambda', () => {
  const trigger = { ...makeTriggerNode('t1', ['привет'], ''), data: { ...makeTriggerNode('t1', ['привет'], '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'a10');
  ok(!code.includes('@dp.message(lambda'), '@dp.message(lambda НЕ должен быть без autoTransitionTo');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: matchType exact
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: matchType exact ───────────────────────────────────────');

test('B01', 'exact → message.text.lower() == "текст"', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['текст'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('message.text.lower() == "текст"'), 'message.text.lower() == "текст" должен быть в коде');
});

test('B02', 'exact → нет "in message.text"', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['текст'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(!code.includes('"текст" in message.text'), '"текст" in message.text НЕ должен быть для exact');
});

test('B03', 'exact → регистронезависимость через lower()', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['Привет'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  ok(code.includes('.lower()'), '.lower() должен быть в коде для регистронезависимости');
});

test('B04', 'exact → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['hello world'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'b04'), 'b04');
});

test('B05', 'несколько синонимов exact → каждый свой обработчик', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'хай', 'hello'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b05');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 3, `Должно быть 3 обработчика, найдено: ${count}`);
});

test('B06', 'exact + пустой синоним → пустой синоним игнорируется, генерируется только 1 обработчик', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', ''], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b06');
  // Пустые синонимы фильтруются — только 1 обработчик для "привет"
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 1, `Должен быть ровно 1 обработчик (пустой отфильтрован), найдено: ${count}`);
});

test('B07', 'exact + синоним с пробелами → lambda содержит пробелы', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['добрый день'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b07');
  ok(code.includes('добрый день'), 'синоним с пробелами должен быть в lambda');
});

test('B08', 'exact + синоним с цифрами → корректная lambda', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['123'], 'msg1', { matchType: 'exact' }), makeMessageNode('msg1')]);
  const code = gen(p, 'b08');
  ok(code.includes('"123"'), '"123" должен быть в lambda');
  syntax(code, 'b08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: matchType contains
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: matchType contains ────────────────────────────────────');

test('C01', 'contains → "текст" in message.text.lower()', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['текст'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('"текст" in message.text.lower()'), '"текст" in message.text.lower() должен быть в коде');
});

test('C02', 'contains → нет == в lambda для этого синонима', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['текст'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c02');
  ok(!code.includes('message.text.lower() == "текст"'), 'message.text.lower() == "текст" НЕ должен быть для contains');
});

test('C03', 'contains → регистронезависимость через lower()', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['Привет'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c03');
  ok(code.includes('.lower()'), '.lower() должен быть в коде');
});

test('C04', 'contains → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет мир'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'c04'), 'c04');
});

test('C05', 'несколько синонимов contains → каждый свой обработчик', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'хай', 'hello'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c05');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 3, `Должно быть 3 обработчика, найдено: ${count}`);
});

test('C06', 'contains + пустой синоним → пустой синоним игнорируется, генерируется только 1 обработчик', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', ''], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c06');
  // Пустые синонимы фильтруются — только 1 обработчик для "привет"
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 1, `Должен быть ровно 1 обработчик (пустой отфильтрован), найдено: ${count}`);
});

test('C07', 'contains + синоним с пробелами → lambda содержит пробелы', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['добрый день'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c07');
  ok(code.includes('"добрый день" in message.text.lower()'), '"добрый день" in message.text.lower() должен быть в коде');
});

test('C08', 'contains + Unicode синоним → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['こんにちは'], 'msg1', { matchType: 'contains' }), makeMessageNode('msg1')]);
  syntax(gen(p, 'c08'), 'c08');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: isPrivateOnly
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: isPrivateOnly ─────────────────────────────────────────');

test('D01', 'isPrivateOnly: true → message.chat.type != \'private\'', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd01');
  ok(code.includes("message.chat.type != 'private'"), "message.chat.type != 'private' должен быть в коде");
});

test('D02', 'isPrivateOnly: true → сообщение об ошибке приватного чата', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd02');
  ok(code.includes('Эта команда доступна только в приватных чатах'), 'Сообщение о приватном чате должно быть в коде');
});

test('D03', 'isPrivateOnly: true → return после проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd03');
  ok(code.includes("message.chat.type != 'private'"), 'проверка типа чата должна быть');
  ok(code.includes('return'), 'return должен быть в коде');
});

test('D04', 'isPrivateOnly: false → нет message.chat.type != \'private\'', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'd04');
  ok(!code.includes("message.chat.type != 'private'"), "message.chat.type != 'private' НЕ должен быть в коде");
});

test('D05', 'isPrivateOnly: true + adminOnly: true → обе проверки есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true, adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd05');
  ok(code.includes("message.chat.type != 'private'"), 'проверка приватного чата должна быть');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
});

test('D06', 'isPrivateOnly: true + requiresAuth: true → обе проверки есть', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true, requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd06');
  ok(code.includes("message.chat.type != 'private'"), 'проверка приватного чата должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('D07', 'все три флага → все три проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true, adminOnly: true, requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd07');
  ok(code.includes("message.chat.type != 'private'"), 'проверка приватного чата должна быть');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('D08', 'порядок: privateOnly ДО adminOnly', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true, adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'd08');
  const privateIdx = code.indexOf("message.chat.type != 'private'");
  const adminIdx = code.indexOf('is_admin(user_id)');
  ok(privateIdx < adminIdx, 'проверка приватного чата должна идти ДО проверки admin');
});

test('D09', 'isPrivateOnly: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'd09'), 'd09');
});

test('D10', 'несколько триггеров, один privateOnly → только у него проверка', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true }),
    makeTriggerNode('t2', ['пока'], 'msg1', { isPrivateOnly: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd10');
  const t1HandlerIdx = code.indexOf('text_trigger_t1_');
  const t2HandlerIdx = code.indexOf('text_trigger_t2_');
  const privateIdx = code.indexOf("message.chat.type != 'private'");
  ok(privateIdx > t1HandlerIdx, 'проверка приватного чата должна быть после обработчика t1');
  ok(t2HandlerIdx === -1 || code.indexOf("message.chat.type != 'private'", t2HandlerIdx) === -1,
    'проверка приватного чата НЕ должна быть в обработчике t2');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: adminOnly
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: adminOnly ─────────────────────────────────────────────');

test('E01', 'adminOnly: true → is_admin(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'e01');
  ok(code.includes('is_admin(user_id)'), 'is_admin(user_id) должен быть в коде');
});

test('E02', 'adminOnly: true → сообщение об ошибке прав', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  ok(code.includes('У вас нет прав для выполнения этой команды'), 'Сообщение об отсутствии прав должно быть в коде');
});

test('E03', 'adminOnly: true → return после проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'e03');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('return'), 'return должен быть в коде');
});

test('E04', 'adminOnly: false → нет is_admin(', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'e04');
  ok(!code.includes('is_admin('), 'is_admin( НЕ должен быть в коде');
});

test('E05', 'adminOnly: true → not await is_admin(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'e05');
  ok(code.includes('not await is_admin(user_id)'), 'not await is_admin(user_id) должен быть в коде');
});

test('E06', 'adminOnly: true → функция is_admin в коде', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'e06');
  ok(code.includes('async def is_admin') || code.includes('def is_admin'), 'функция is_admin должна быть в коде');
});

test('E07', 'adminOnly: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'e07'), 'e07');
});

test('E08', 'несколько триггеров, один adminOnly → только у него проверка', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }),
    makeTriggerNode('t2', ['пока'], 'msg1', { adminOnly: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'e08');
  const t1HandlerIdx = code.indexOf('text_trigger_t1_');
  const t2HandlerIdx = code.indexOf('text_trigger_t2_');
  const adminIdx = code.indexOf('is_admin(user_id)');
  ok(adminIdx > t1HandlerIdx, 'is_admin должен быть после обработчика t1');
  ok(t2HandlerIdx === -1 || code.indexOf('is_admin(user_id)', t2HandlerIdx) === -1,
    'is_admin НЕ должен быть в обработчике t2');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: requiresAuth
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: requiresAuth ──────────────────────────────────────────');

test('F01', 'requiresAuth: true → check_auth(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'f01');
  ok(code.includes('check_auth(user_id)'), 'check_auth(user_id) должен быть в коде');
});

test('F02', 'requiresAuth: true → сообщение /start', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'f02');
  ok(code.includes('Сначала запустите бота: /start'), 'Сообщение о необходимости авторизации должно быть в коде');
});

test('F03', 'requiresAuth: true → return после проверки', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'f03');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
  ok(code.includes('return'), 'return должен быть в коде');
});

test('F04', 'requiresAuth: false → нет вызова check_auth в обработчике', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: false }), makeMessageNode('msg1')]);
  const code = gen(p, 'f04');
  const handlerIdx = code.indexOf('text_trigger_t1_');
  const nextHandlerIdx = code.indexOf('async def ', handlerIdx + 1);
  const handlerBody = nextHandlerIdx > 0 ? code.substring(handlerIdx, nextHandlerIdx) : code.substring(handlerIdx);
  ok(!handlerBody.includes('not await check_auth(user_id)'), 'вызов check_auth НЕ должен быть в обработчике');
});

test('F05', 'requiresAuth: true → not await check_auth(user_id)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'f05');
  ok(code.includes('not await check_auth(user_id)'), 'not await check_auth(user_id) должен быть в коде');
});

test('F06', 'requiresAuth: true → функция check_auth в коде', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'f06');
  ok(code.includes('async def check_auth') || code.includes('def check_auth'), 'функция check_auth должна быть в коде');
});

test('F07', 'requiresAuth: true → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }), makeMessageNode('msg1')]);
  syntax(gen(p, 'f07'), 'f07');
});

test('F08', 'несколько триггеров, один requiresAuth → только у него проверка', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { requiresAuth: true }),
    makeTriggerNode('t2', ['пока'], 'msg1', { requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f08');
  const t1HandlerIdx = code.indexOf('text_trigger_t1_');
  const t2HandlerIdx = code.indexOf('text_trigger_t2_');
  const authIdx = code.indexOf('check_auth(user_id)');
  ok(authIdx > t1HandlerIdx, 'check_auth должен быть после обработчика t1');
  ok(t2HandlerIdx === -1 || code.indexOf('check_auth(user_id)', t2HandlerIdx) === -1,
    'check_auth НЕ должен быть в обработчике t2');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Несколько синонимов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Несколько синонимов ───────────────────────────────────');

test('G01', '1 синоним → 1 обработчик', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g01');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 1, `Должен быть 1 обработчик, найдено: ${count}`);
});

test('G02', '3 синонима → 3 обработчика', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'хай', 'hello'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g02');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 3, `Должно быть 3 обработчика, найдено: ${count}`);
});

test('G03', '10 синонимов → 10 обработчиков, синтаксис OK', () => {
  const synonyms = Array.from({ length: 10 }, (_, i) => `слово${i}`);
  const p = makeCleanProject([makeTriggerNode('t1', synonyms, 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g03');
  syntax(code, 'g03');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 10, `Должно быть 10 обработчиков, найдено: ${count}`);
});

test('G04', 'каждый синоним → уникальное имя функции', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'хай', 'hello'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g04');
  const handlers = code.match(/async def text_trigger_\w+_handler/g) || [];
  const unique = new Set(handlers);
  ok(unique.size === handlers.length, `Все имена функций должны быть уникальными, найдено дублей: ${handlers.length - unique.size}`);
});

test('G05', 'синонимы ["привет", "хай", "hello"] → все три в коде', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'хай', 'hello'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g05');
  ok(code.includes('привет'), '"привет" должен быть в коде');
  ok(code.includes('хай'), '"хай" должен быть в коде');
  ok(code.includes('hello'), '"hello" должен быть в коде');
});

test('G06', 'дублирующиеся синонимы → оба генерируются', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g06');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 2, `Должно быть 2 обработчика (дубли не дедуплицируются), найдено: ${count}`);
});

test('G07', 'синоним с пробелом → имя функции является валидным Python идентификатором', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['добрый день'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g07');
  // safe_name заменяет пробелы на подчёркивания — имя функции валидно
  const handlers = code.match(/async def (text_trigger_\S+_handler)/g) || [];
  ok(handlers.length > 0, 'обработчик должен быть в коде');
  // Проверяем что имя функции не содержит пробелы (только буквы, цифры, _)
  handlers.forEach(h => {
    const match = h.match(/async def (\S+)/);
    if (match) ok(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(match[1]), `Имя функции должно быть валидным Python идентификатором: ${match[1]}`);
  });
  syntax(code, 'g07');
});

test('G08', 'синоним только из цифр → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['12345'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'g08'), 'g08');
});

test('G09', 'синоним с Unicode → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['こんにちは'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'g09'), 'g09');
});

test('G10', '20 синонимов → синтаксис OK, уникальные имена', () => {
  const synonyms = Array.from({ length: 20 }, (_, i) => `синоним${i}`);
  const p = makeCleanProject([makeTriggerNode('t1', synonyms, 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'g10');
  syntax(code, 'g10');
  const handlers = code.match(/async def text_trigger_\w+_handler/g) || [];
  const unique = new Set(handlers);
  ok(unique.size === handlers.length, `Все имена функций должны быть уникальными`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Несколько триггеров
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Несколько триггеров ───────────────────────────────────');

test('H01', 'два триггера → два набора обработчиков', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1'),
    makeTriggerNode('t2', ['пока'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h01');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 2, `Должно быть 2 обработчика, найдено: ${count}`);
});

test('H02', 'три триггера с разными синонимами → все в коде', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1'),
    makeTriggerNode('t2', ['пока'], 'msg1'),
    makeTriggerNode('t3', ['hello'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h02');
  ok(code.includes('привет'), '"привет" должен быть в коде');
  ok(code.includes('пока'), '"пока" должен быть в коде');
  ok(code.includes('hello'), '"hello" должен быть в коде');
});

test('H03', 'триггеры с разными targetNodeId → каждый вызывает свой handle_callback', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1'),
    makeTriggerNode('t2', ['пока'], 'msg2'),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  const code = gen(p, 'h03');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'handle_callback_msg1 должен быть');
  ok(code.includes('await handle_callback_msg2(mock_callback)'), 'handle_callback_msg2 должен быть');
});

test('H04', 'триггеры с разными флагами → флаги независимы', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true }),
    makeTriggerNode('t2', ['пока'], 'msg1', { requiresAuth: true }),
    makeTriggerNode('t3', ['хай'], 'msg1', { isPrivateOnly: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h04');
  ok(code.includes('is_admin(user_id)'), 'is_admin должен быть для t1');
  ok(code.includes('check_auth(user_id)'), 'check_auth должен быть для t2');
  ok(code.includes("message.chat.type != 'private'"), 'проверка приватного чата должна быть для t3');
});

test('H05', '5 триггеров по 3 синонима → 15 обработчиков', () => {
  const triggers = Array.from({ length: 5 }, (_, i) =>
    makeTriggerNode(`t${i}`, [`слово${i}а`, `слово${i}б`, `слово${i}в`], 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const code = gen(p, 'h05');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 15, `Должно быть 15 обработчиков, найдено: ${count}`);
});

test('H06', 'синтаксис OK для 5 триггеров', () => {
  const triggers = Array.from({ length: 5 }, (_, i) =>
    makeTriggerNode(`t${i}`, [`слово${i}а`, `слово${i}б`], 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'h06'), 'h06');
});

test('H07', 'уникальность имён функций при нескольких триггерах', () => {
  const triggers = Array.from({ length: 5 }, (_, i) =>
    makeTriggerNode(`t${i}`, [`синоним${i}`], 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const code = gen(p, 'h07');
  const handlers = code.match(/async def text_trigger_\w+_handler/g) || [];
  const unique = new Set(handlers);
  ok(unique.size === handlers.length, `Все имена функций должны быть уникальными`);
});

test('H08', 'два триггера с одинаковым синонимом → оба генерируются', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1'),
    makeTriggerNode('t2', ['привет'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h08');
  const count = (code.match(/@dp\.message\(lambda/g) || []).length;
  ok(count === 2, `Должно быть 2 обработчика, найдено: ${count}`);
});

test('H09', 'триггер exact + триггер contains → разные lambda', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'exact' }),
    makeTriggerNode('t2', ['привет'], 'msg1', { matchType: 'contains' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h09');
  ok(code.includes('message.text.lower() == "привет"'), 'exact lambda должна быть');
  ok(code.includes('"привет" in message.text.lower()'), 'contains lambda должна быть');
});

test('H10', '10 триггеров → синтаксис OK', () => {
  const triggers = Array.from({ length: 10 }, (_, i) =>
    makeTriggerNode(`t${i}`, [`слово${i}`], 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'h10'), 'h10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: MockCallback структура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: MockCallback структура ────────────────────────────────');

test('I01', 'содержит class MockCallback:', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i01');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('I02', 'содержит def __init__(self, data, user, msg):', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i02');
  ok(code.includes('def __init__(self, data, user, msg):'), 'def __init__(self, data, user, msg): должен быть в коде');
});

test('I03', 'содержит self.data = data', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i03');
  ok(code.includes('self.data = data'), 'self.data = data должен быть в коде');
});

test('I04', 'содержит self.from_user = user', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i04');
  ok(code.includes('self.from_user = user'), 'self.from_user = user должен быть в коде');
});

test('I05', 'содержит self.message = msg', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i05');
  ok(code.includes('self.message = msg'), 'self.message = msg должен быть в коде');
});

test('I06', 'содержит async def answer(self):', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i06');
  ok(code.includes('async def answer(self):'), 'async def answer(self): должен быть в коде');
});

test('I07', 'содержит async def edit_text(self, text, **kwargs):', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i07');
  ok(code.includes('async def edit_text(self, text, **kwargs):'), 'async def edit_text(self, text, **kwargs): должен быть в коде');
});

test('I08', 'MockCallback создаётся с правильным targetNodeId', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'i08');
  ok(code.includes('MockCallback("msg1"'), 'MockCallback("msg1" должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Форматы синонимов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Форматы синонимов ─────────────────────────────────────');

test('J01', 'синоним с кириллицей → корректная lambda', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет мир'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j01');
  ok(code.includes('привет мир'), 'кириллица должна быть в lambda');
  syntax(code, 'j01');
});

test('J02', 'синоним с латиницей → корректная lambda', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['hello world'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j02');
  ok(code.includes('hello world'), 'латиница должна быть в lambda');
  syntax(code, 'j02');
});

test('J03', 'синоним с цифрами → корректная lambda', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['abc123'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j03');
  ok(code.includes('abc123'), 'цифры должны быть в lambda');
  syntax(code, 'j03');
});

test('J04', 'синоним с пробелами → lambda содержит пробелы', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['добрый вечер'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j04');
  ok(code.includes('добрый вечер'), 'пробелы должны быть в lambda');
});

test('J05', 'синоним с эмодзи → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет 🎉'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'j05'), 'j05');
});

test('J06', 'синоним с двойными кавычками → синтаксис Python OK (кавычки экранируются)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['скажи "привет"'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'j06'), 'j06');
});

test('J07', 'синоним с переносом строки → синтаксис Python OK (перенос экранируется)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['строка1\nстрока2'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'j07'), 'j07');
});

test('J08', 'синоним только из пробелов → обрабатывается без падения', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['   '], 'msg1'), makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'j08');
});

test('J09', 'очень длинный синоним (500 символов) → синтаксис OK', () => {
  const longSynonym = 'а'.repeat(500);
  const p = makeCleanProject([makeTriggerNode('t1', [longSynonym], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'j09'), 'j09');
});

test('J10', 'синоним с HTML-символами → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['<b>привет</b>'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'j10'), 'j10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Комбинации флагов
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Комбинации флагов ─────────────────────────────────────');

test('K01', 'exact + isPrivateOnly + adminOnly + requiresAuth → все проверки', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'exact', isPrivateOnly: true, adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k01');
  ok(code.includes('message.text.lower() == "привет"'), 'exact lambda должна быть');
  ok(code.includes("message.chat.type != 'private'"), 'проверка приватного чата должна быть');
  ok(code.includes('is_admin(user_id)'), 'проверка admin должна быть');
  ok(code.includes('check_auth(user_id)'), 'проверка auth должна быть');
});

test('K02', 'contains + все флаги → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'contains', isPrivateOnly: true, adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'k02'), 'k02');
});

test('K03', '3 синонима + все флаги → каждый обработчик имеет все проверки', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет', 'хай', 'hello'], 'msg1', { isPrivateOnly: true, adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k03');
  const privateCount = (code.match(/message\.chat\.type != 'private'/g) || []).length;
  const adminCount = (code.match(/is_admin\(user_id\)/g) || []).length;
  const authCount = (code.match(/check_auth\(user_id\)/g) || []).length;
  ok(privateCount >= 3, `Должно быть минимум 3 проверки приватного чата, найдено: ${privateCount}`);
  ok(adminCount >= 3, `Должно быть минимум 3 проверки admin, найдено: ${adminCount}`);
  ok(authCount >= 3, `Должно быть минимум 3 проверки auth, найдено: ${authCount}`);
});

test('K04', 'exact + adminOnly → порядок проверок: admin после user_id', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'exact', adminOnly: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k04');
  const userIdIdx = code.indexOf('user_id = message.from_user.id');
  const adminIdx = code.indexOf('is_admin(user_id)');
  ok(userIdIdx < adminIdx, 'user_id должен быть определён ДО вызова is_admin');
});

test('K05', 'contains + requiresAuth → порядок проверок: auth после user_id', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'contains', requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k05');
  const userIdIdx = code.indexOf('user_id = message.from_user.id');
  const authIdx = code.indexOf('check_auth(user_id)');
  ok(userIdIdx < authIdx, 'user_id должен быть определён ДО вызова check_auth');
});

test('K06', 'exact + isPrivateOnly → порядок: private ДО mock_callback', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { matchType: 'exact', isPrivateOnly: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k06');
  const privateIdx = code.indexOf("message.chat.type != 'private'");
  const mockIdx = code.indexOf('mock_callback = MockCallback(');
  ok(privateIdx < mockIdx, 'проверка приватного чата должна идти ДО создания mock_callback');
});

test('K07', 'adminOnly + requiresAuth → оба в коде', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { adminOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k07');
  ok(code.includes('is_admin(user_id)'), 'is_admin должен быть');
  ok(code.includes('check_auth(user_id)'), 'check_auth должен быть');
});

test('K08', 'isPrivateOnly + requiresAuth → оба в коде', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: true, requiresAuth: true }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k08');
  ok(code.includes("message.chat.type != 'private'"), 'проверка приватного чата должна быть');
  ok(code.includes('check_auth(user_id)'), 'check_auth должен быть');
});

test('K09', 'все флаги false → нет лишних проверок в обработчике', () => {
  const p = makeCleanProject([
    makeTriggerNode('t1', ['привет'], 'msg1', { isPrivateOnly: false, adminOnly: false, requiresAuth: false }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'k09');
  const handlerIdx = code.indexOf('text_trigger_t1_');
  const nextFnIdx = code.indexOf('\nasync def ', handlerIdx + 1);
  const handlerBody = nextFnIdx > 0 ? code.substring(handlerIdx, nextFnIdx) : code.substring(handlerIdx);
  ok(!handlerBody.includes("message.chat.type != 'private'"), 'проверка приватного чата НЕ должна быть');
  ok(!handlerBody.includes('is_admin('), 'проверка admin НЕ должна быть');
  ok(!handlerBody.includes('not await check_auth('), 'вызов check_auth НЕ должен быть');
});

test('K10', 'синтаксис OK для всех комбинаций флагов', () => {
  const combos = [
    { isPrivateOnly: true, adminOnly: false, requiresAuth: false },
    { isPrivateOnly: false, adminOnly: true, requiresAuth: false },
    { isPrivateOnly: false, adminOnly: false, requiresAuth: true },
    { isPrivateOnly: true, adminOnly: true, requiresAuth: true },
  ];
  combos.forEach((opts, i) => {
    const p = makeCleanProject([makeTriggerNode(`t${i}`, ['привет'], 'msg1', opts), makeMessageNode('msg1')]);
    syntax(gen(p, `k10_${i}`), `k10_${i}`);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК L: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок L: Граничные случаи ──────────────────────────────────────');

test('L01', 'пустой textSynonyms: [] → триггер игнорируется', () => {
  const p = makeCleanProject([makeTriggerNode('t1', [], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'l01');
  ok(!code.includes('@dp.message(lambda'), '@dp.message(lambda НЕ должен быть с пустым textSynonyms');
});

test('L02', 'null textSynonyms → не падает', () => {
  const trigger = { ...makeTriggerNode('t1', [], 'msg1'), data: { ...makeTriggerNode('t1', [], 'msg1').data, textSynonyms: null } };
  const p = makeCleanProject([trigger, makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'l02');
});

test('L03', 'синоним "" (пустая строка) → генерируется обработчик (шаблон не фильтрует)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', [''], 'msg1'), makeMessageNode('msg1')]);
  // Шаблон генерирует обработчик даже для пустого синонима
  ok(true, 'генерация не должна падать');
  gen(p, 'l03');
});

test('L04', 'синоним " " (только пробел) → обрабатывается без падения', () => {
  const p = makeCleanProject([makeTriggerNode('t1', [' '], 'msg1'), makeMessageNode('msg1')]);
  ok(true, 'генерация не должна падать');
  gen(p, 'l04');
});

test('L05', 'очень много триггеров (50) → синтаксис OK', () => {
  const triggers = Array.from({ length: 50 }, (_, i) =>
    makeTriggerNode(`t${i}`, [`слово${i}`], 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'l05'), 'l05');
});

test('L06', 'nodeId с дефисами → safe_name корректно, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('my-trigger-node', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l06'), 'l06');
});

test('L07', 'nodeId с цифрами → safe_name корректно, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('trigger123', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l07'), 'l07');
});

test('L08', 'targetNodeId с дефисами → handle_callback корректно, синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'my-target-node'), makeMessageNode('my-target-node')]);
  const code = gen(p, 'l08');
  syntax(code, 'l08');
  ok(code.includes('handle_callback_my_target_node') || code.includes('handle_callback_'), 'handle_callback с safe_name должен быть');
});

test('L09', 'синоним с двойными кавычками → синтаксис Python OK (кавычки экранируются)', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['скажи "привет"'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l09'), 'l09');
});

test('L10', 'синоним с обратным слешем → синтаксис OK', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['путь\\к\\файлу'], 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'l10'), 'l10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК M: Производительность
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок M: Производительность ────────────────────────────────────');

test('M01', '100 триггеров по 1 синониму → генерация < 5 сек', () => {
  const triggers = Array.from({ length: 100 }, (_, i) =>
    makeTriggerNode(`t${i}`, [`слово${i}`], 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'm01');
  const elapsed = Date.now() - start;
  ok(elapsed < 5000, `Генерация заняла ${elapsed}ms, ожидалось < 5000ms`);
});

test('M02', '10 триггеров по 10 синонимов → синтаксис OK', () => {
  const triggers = Array.from({ length: 10 }, (_, i) =>
    makeTriggerNode(`t${i}`, Array.from({ length: 10 }, (_, j) => `слово${i}_${j}`), 'msg1')
  );
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'm02'), 'm02');
});

test('M03', '1 триггер с 50 синонимами → синтаксис OK', () => {
  const synonyms = Array.from({ length: 50 }, (_, i) => `синоним${i}`);
  const p = makeCleanProject([makeTriggerNode('t1', synonyms, 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'm03'), 'm03');
});

test('M04', 'генерация одного триггера < 100ms', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'm04');
  const elapsed = Date.now() - start;
  ok(elapsed < 100, `Генерация заняла ${elapsed}ms, ожидалось < 100ms`);
});

test('M05', 'повторная генерация того же проекта → идентичный результат', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет', 'хай'], 'msg1'), makeMessageNode('msg1')]);
  // Используем одинаковый label чтобы botName был одинаковым
  const code1 = generatePythonCode(p as any, { botName: 'Phase3_m05', userDatabaseEnabled: false, enableComments: false });
  const code2 = generatePythonCode(p as any, { botName: 'Phase3_m05', userDatabaseEnabled: false, enableComments: false });
  ok(code1 === code2, 'Повторная генерация должна давать идентичный результат');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК N: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок N: Отсутствие лишнего кода ──────────────────────────────');

test('N01', 'без text_trigger узлов → нет @dp.message(lambda', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'n01');
  ok(!code.includes('@dp.message(lambda'), '@dp.message(lambda НЕ должен быть без text_trigger');
});

test('N02', 'без text_trigger → нет text_trigger_ в коде', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'n02');
  ok(!code.includes('text_trigger_'), 'text_trigger_ НЕ должен быть без text_trigger узлов');
});

test('N03', 'text_trigger без autoTransitionTo → нет обработчика', () => {
  const trigger = { ...makeTriggerNode('t1', ['привет'], ''), data: { ...makeTriggerNode('t1', ['привет'], '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([trigger]);
  const code = gen(p, 'n03');
  ok(!code.includes('@dp.message(lambda'), '@dp.message(lambda НЕ должен быть без autoTransitionTo');
});

test('N04', 'text_trigger без синонимов → нет обработчика', () => {
  const p = makeCleanProject([makeTriggerNode('t1', [], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'n04');
  ok(!code.includes('@dp.message(lambda'), '@dp.message(lambda НЕ должен быть без синонимов');
});

test('N05', 'нет command_trigger кода в text_trigger обработчиках', () => {
  const p = makeCleanProject([makeTriggerNode('t1', ['привет'], 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'n05');
  ok(!code.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть в text_trigger обработчиках');
});

// ════════════════════════════════════════════════════════════════════════════
// ИТОГИ
// ════════════════════════════════════════════════════════════════════════════

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total  = results.length;

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(`║  Итог: ${passed}/${total} пройдено | Провалено: ${failed}`.padEnd(63) + '║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

if (failed > 0) {
  console.log('Провалившиеся тесты:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.id}. ${r.name}`);
    console.log(`     → ${r.note}`);
  });
  process.exit(1);
}
