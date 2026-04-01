/**
 * @fileoverview Интеграционные тесты для узла incoming_message_trigger
 *
 * Блок A: Базовая генерация middleware
 * Блок B: Несколько триггеров
 * Блок C: Совместная работа с другими триггерами
 * Блок D: Целевые узлы (targetNodeId)
 * Блок E: MockCallback структура
 * Блок F: Интеграция с userDatabaseEnabled
 * Блок G: Граничные случаи
 * Блок H: Порядок регистрации
 * Блок I: Производительность
 * Блок J: Отсутствие лишнего кода
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
  return generatePythonCode(project as any, { botName: `PhaseIMT_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `PhaseIMTDB_${label}`, userDatabaseEnabled: true, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_pimt_${label}.py`;
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

/** Создаёт узел incoming_message_trigger */
function makeIncomingTriggerNode(id: string, targetId: string) {
  return {
    id,
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: targetId, buttons: [], keyboardType: 'none' },
  };
}

/** Создаёт message-узел */
function makeMessageNode(id: string, text = 'Ответ') {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: text, buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

/** Создаёт command_trigger узел */
function makeCommandTriggerNode(id: string, command: string, targetId: string) {
  return {
    id,
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command,
      description: 'Команда',
      showInMenu: true,
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

/** Создаёт text_trigger узел */
function makeTextTriggerNode(id: string, synonyms: string[], targetId: string) {
  return {
    id,
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: synonyms,
      textMatchType: 'exact',
      adminOnly: false,
      requiresAuth: false,
      autoTransitionTo: targetId,
      buttons: [],
      keyboardType: 'none',
    },
  };
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест — Узел incoming_message_trigger                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация middleware
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация middleware ──────────────────────────');

test('A01', 'incoming_message_trigger + autoTransitionTo → генерируется async def incoming_message_trigger_<id>_middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('async def incoming_message_trigger_imt1_middleware'), 'async def incoming_message_trigger_imt1_middleware должен быть в коде');
});

test('A02', 'содержит dp.message.middleware(incoming_message_trigger_<id>_middleware)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('dp.message.middleware(incoming_message_trigger_imt1_middleware)'), 'dp.message.middleware(...) должен быть в коде');
});

test('A03', 'содержит return await handler(event, data)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('return await handler(event, data)'), 'return await handler(event, data) должен быть в коде');
});

test('A04', 'содержит class MockCallback:', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('class MockCallback:'), 'class MockCallback: должен быть в коде');
});

test('A05', 'содержит mock_callback = MockCallback(', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('mock_callback = MockCallback('), 'mock_callback = MockCallback( должен быть в коде');
});

test('A06', 'содержит await handle_callback_<targetId>(mock_callback)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'await handle_callback_msg1(mock_callback) должен быть в коде');
});

test('A07', 'содержит logging.info(', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('logging.info('), 'logging.info должен быть в коде');
});

test('A08', 'содержит user_id = event.from_user.id', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a08');
  ok(code.includes('user_id = event.from_user.id'), 'user_id = event.from_user.id должен быть в коде');
});

test('A09', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a09'), 'a09');
});

test('A10', 'без autoTransitionTo → триггер игнорируется, нет middleware функции', () => {
  const node = { ...makeIncomingTriggerNode('imt1', ''), data: { ...makeIncomingTriggerNode('imt1', '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([node]);
  const code = gen(p, 'a10');
  ok(!code.includes('incoming_message_trigger_imt1_middleware'), 'middleware НЕ должен быть без autoTransitionTo');
});

test('A11', 'содержит logging.error( для обработки исключений', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a11');
  ok(code.includes('logging.error('), 'logging.error должен быть в коде');
});

test('A12', 'содержит try: / except Exception', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a12');
  ok(code.includes('try:'), 'try: должен быть в коде');
  ok(code.includes('except Exception'), 'except Exception должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Несколько триггеров
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Несколько триггеров ───────────────────────────────────');

test('B01', 'два incoming_message_trigger → два middleware', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeIncomingTriggerNode('imt2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b01');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'middleware imt1 должен быть');
  ok(code.includes('incoming_message_trigger_imt2_middleware'), 'middleware imt2 должен быть');
});

test('B02', 'три триггера → три dp.message.middleware(...) вызова', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeIncomingTriggerNode('imt2', 'msg1'),
    makeIncomingTriggerNode('imt3', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b02');
  const count = (code.match(/dp\.message\.middleware\(incoming_message_trigger_/g) || []).length;
  ok(count === 3, `Должно быть 3 dp.message.middleware вызова, найдено: ${count}`);
});

test('B03', 'каждый триггер имеет уникальное имя функции', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeIncomingTriggerNode('imt2', 'msg1'),
    makeIncomingTriggerNode('imt3', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b03');
  const fns = code.match(/async def incoming_message_trigger_\w+_middleware/g) || [];
  const unique = new Set(fns);
  ok(unique.size === fns.length, `Все имена функций должны быть уникальными, дублей: ${fns.length - unique.size}`);
});

test('B04', 'каждый вызывает свой handle_callback_<targetId>', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeIncomingTriggerNode('imt2', 'msg2'),
    makeMessageNode('msg1', 'Ответ 1'),
    makeMessageNode('msg2', 'Ответ 2'),
  ]);
  const code = gen(p, 'b04');
  ok(code.includes('await handle_callback_msg1(mock_callback)'), 'handle_callback_msg1 должен быть');
  ok(code.includes('await handle_callback_msg2(mock_callback)'), 'handle_callback_msg2 должен быть');
});

test('B05', '5 триггеров → синтаксис OK', () => {
  const triggers = Array.from({ length: 5 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'b05'), 'b05');
});

test('B06', '10 триггеров → синтаксис OK, уникальные имена', () => {
  const triggers = Array.from({ length: 10 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const code = gen(p, 'b06');
  syntax(code, 'b06');
  const fns = code.match(/async def incoming_message_trigger_\w+_middleware/g) || [];
  const unique = new Set(fns);
  ok(unique.size === fns.length, `Все имена функций должны быть уникальными`);
});

test('B07', 'два триггера с разными targetId → оба handle_callback в коде', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'target_a'),
    makeIncomingTriggerNode('imt2', 'target_b'),
    makeMessageNode('target_a', 'Ответ A'),
    makeMessageNode('target_b', 'Ответ B'),
  ]);
  const code = gen(p, 'b07');
  ok(code.includes('handle_callback_target_a'), 'handle_callback_target_a должен быть');
  ok(code.includes('handle_callback_target_b'), 'handle_callback_target_b должен быть');
});

test('B08', 'два триггера, один без autoTransitionTo → только один middleware', () => {
  const withTarget = makeIncomingTriggerNode('imt1', 'msg1');
  const withoutTarget = { ...makeIncomingTriggerNode('imt2', ''), data: { ...makeIncomingTriggerNode('imt2', '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([withTarget, withoutTarget, makeMessageNode('msg1')]);
  const code = gen(p, 'b08');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'middleware imt1 должен быть');
  ok(!code.includes('incoming_message_trigger_imt2_middleware'), 'middleware imt2 НЕ должен быть');
});

test('B09', '20 триггеров → синтаксис OK', () => {
  const triggers = Array.from({ length: 20 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'b09'), 'b09');
});

test('B10', 'уникальность имён при 20 триггерах', () => {
  const triggers = Array.from({ length: 20 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const code = gen(p, 'b10');
  const fns = code.match(/async def incoming_message_trigger_\w+_middleware/g) || [];
  const unique = new Set(fns);
  ok(unique.size === fns.length, `Все имена функций должны быть уникальными при 20 триггерах`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Совместная работа с другими триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Совместная работа с другими триггерами ────────────────');

test('C01', 'command_trigger + incoming_message_trigger → оба в коде', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c01');
  ok(code.includes('@dp.message(Command('), 'command_trigger должен быть в коде');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming_message_trigger должен быть в коде');
});

test('C02', 'text_trigger + incoming_message_trigger → оба в коде', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c02');
  ok(code.includes('@dp.message(lambda'), 'text_trigger должен быть в коде');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming_message_trigger должен быть в коде');
});

test('C03', 'command_trigger + text_trigger + incoming_message_trigger → все три в коде', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c03');
  ok(code.includes('@dp.message(Command('), 'command_trigger должен быть');
  ok(code.includes('@dp.message(lambda'), 'text_trigger должен быть');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming_message_trigger должен быть');
});

test('C04', 'incoming_message_trigger не мешает генерации command_trigger (@dp.message(Command(...)))', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c04');
  ok(code.includes('@dp.message(Command("start")'), '@dp.message(Command("start")) должен быть в коде');
});

test('C05', 'incoming_message_trigger не мешает генерации text_trigger (@dp.message(lambda...))', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'c05');
  ok(code.includes('@dp.message(lambda'), '@dp.message(lambda должен быть в коде');
});

test('C06', 'command_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c06'), 'c06');
});

test('C07', 'text_trigger + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c07'), 'c07');
});

test('C08', 'все три типа триггеров → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'c08'), 'c08');
});

test('C09', 'incoming_message_trigger → нет @dp.message(Command(...)) в middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c09');
  // Ищем тело middleware функции
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const middlewareBody = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!middlewareBody.includes('@dp.message(Command('), '@dp.message(Command(...)) НЕ должен быть внутри middleware');
});

test('C10', 'incoming_message_trigger → нет lambda в middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c10');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const middlewareBody = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!middlewareBody.includes('@dp.message(lambda'), '@dp.message(lambda НЕ должен быть внутри middleware');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Целевые узлы (targetNodeId)
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Целевые узлы (targetNodeId) ───────────────────────────');

test('D01', 'targetId = message-узел → handle_callback_<id> в коде', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'd01');
  ok(code.includes('handle_callback_msg_target'), 'handle_callback_msg_target должен быть в коде');
});

test('D02', 'targetId = condition-узел → handle_callback_<id> в коде', () => {
  const condNode = { id: 'cond1', type: 'condition', position: { x: 0, y: 0 }, data: { conditions: [], defaultTargetId: '' } };
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'cond1'), condNode]);
  const code = gen(p, 'd02');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть в коде');
});

test('D03', 'targetId с цифрами в ID → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'node123'), makeMessageNode('node123')]);
  syntax(gen(p, 'd03'), 'd03');
});

test('D04', 'targetId с подчёркиваниями → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'my_target_node'), makeMessageNode('my_target_node')]);
  syntax(gen(p, 'd04'), 'd04');
});

test('D05', 'targetId с длинным именем → синтаксис OK', () => {
  const longId = 'very_long_target_node_id_that_is_quite_descriptive_and_long';
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', longId), makeMessageNode(longId)]);
  syntax(gen(p, 'd05'), 'd05');
});

test('D06', 'несколько триггеров с разными targetId → все handle_callback в коде', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'target1'),
    makeIncomingTriggerNode('imt2', 'target2'),
    makeIncomingTriggerNode('imt3', 'target3'),
    makeMessageNode('target1'),
    makeMessageNode('target2'),
    makeMessageNode('target3'),
  ]);
  const code = gen(p, 'd06');
  ok(code.includes('handle_callback_target1'), 'handle_callback_target1 должен быть');
  ok(code.includes('handle_callback_target2'), 'handle_callback_target2 должен быть');
  ok(code.includes('handle_callback_target3'), 'handle_callback_target3 должен быть');
});

test('D07', 'targetId несуществующего узла → генерация не падает', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'nonexistent_node_xyz')]);
  let threw = false;
  try { gen(p, 'd07'); } catch { threw = true; }
  ok(!threw, 'генерация не должна падать при несуществующем targetId');
});

test('D08', 'targetId = forward_message узел → синтаксис OK', () => {
  const fwdNode = { id: 'fwd1', type: 'forward_message', position: { x: 0, y: 0 }, data: { targetChatId: '123', messageText: 'Текст', buttons: [], keyboardType: 'none' } };
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'fwd1'), fwdNode]);
  syntax(gen(p, 'd08'), 'd08');
});

test('D09', 'targetId = input узел → синтаксис OK', () => {
  const inputNode = { id: 'inp1', type: 'input', position: { x: 0, y: 0 }, data: { variableName: 'user_input', promptText: 'Введите:', buttons: [], keyboardType: 'none' } };
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'inp1'), inputNode]);
  syntax(gen(p, 'd09'), 'd09');
});

test('D10', 'targetId = broadcast узел → синтаксис OK', () => {
  const broadcastNode = { id: 'bc1', type: 'broadcast', position: { x: 0, y: 0 }, data: { messageText: 'Рассылка', buttons: [], keyboardType: 'none' } };
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'bc1'), broadcastNode]);
  syntax(gen(p, 'd10'), 'd10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: MockCallback структура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: MockCallback структура ────────────────────────────────');

test('E01', 'содержит def __init__(self, data, user, msg):', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e01');
  ok(code.includes('def __init__(self, data, user, msg):'), 'def __init__(self, data, user, msg): должен быть в коде');
});

test('E02', 'содержит self.data = data', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  ok(code.includes('self.data = data'), 'self.data = data должен быть в коде');
});

test('E03', 'содержит self.from_user = user', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e03');
  ok(code.includes('self.from_user = user'), 'self.from_user = user должен быть в коде');
});

test('E04', 'содержит self.message = msg', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e04');
  ok(code.includes('self.message = msg'), 'self.message = msg должен быть в коде');
});

test('E05', 'содержит async def answer(self, *args, **kwargs):', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e05');
  ok(code.includes('async def answer(self, *args, **kwargs):'), 'async def answer(self, *args, **kwargs): должен быть в коде');
});

test('E06', 'содержит async def edit_text(self, text, **kwargs):', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e06');
  ok(code.includes('async def edit_text(self, text, **kwargs):'), 'async def edit_text(self, text, **kwargs): должен быть в коде');
});

test('E07', 'содержит self.message.edit_text', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e07');
  ok(code.includes('self.message.edit_text'), 'self.message.edit_text должен быть в коде');
});

test('E08', 'содержит self.message.answer', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e08');
  ok(code.includes('self.message.answer'), 'self.message.answer должен быть в коде');
});

test('E09', 'MockCallback передаёт правильный targetNodeId как data', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'my_target'), makeMessageNode('my_target')]);
  const code = gen(p, 'e09');
  ok(code.includes('"my_target"'), 'targetNodeId "my_target" должен передаваться в MockCallback как data');
});

test('E10', 'MockCallback передаёт event.from_user как user', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e10');
  ok(code.includes('event.from_user'), 'event.from_user должен передаваться в MockCallback');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Интеграция с userDatabaseEnabled
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Интеграция с userDatabaseEnabled ──────────────────────');

test('F01', 'userDatabaseEnabled: true + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  syntax(genDB(p, 'f01'), 'f01');
});

test('F02', 'userDatabaseEnabled: true → ЕСТЬ message_logging_middleware И incoming_message_trigger middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = genDB(p, 'f02');
  ok(code.includes('message_logging_middleware'), 'message_logging_middleware должен быть в коде');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming_message_trigger middleware должен быть в коде');
});

test('F03', 'userDatabaseEnabled: true → оба middleware регистрируются через dp.message.middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = genDB(p, 'f03');
  ok(code.includes('dp.message.middleware(message_logging_middleware)'), 'dp.message.middleware(message_logging_middleware) должен быть');
  ok(code.includes('dp.message.middleware(incoming_message_trigger_imt1_middleware)'), 'dp.message.middleware(incoming_message_trigger_imt1_middleware) должен быть');
});

test('F04', 'userDatabaseEnabled: false + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'f04'), 'f04');
});

test('F05', 'userDatabaseEnabled: false → НЕТ message_logging_middleware, НО ЕСТЬ incoming_message_trigger middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f05');
  ok(!code.includes('message_logging_middleware'), 'message_logging_middleware НЕ должен быть без DB');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming_message_trigger middleware должен быть');
});

test('F06', 'userDatabaseEnabled: true + inline + incoming_message_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'msg1' }] } },
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(genDB(p, 'f06'), 'f06');
});

test('F07', 'incoming_message_trigger + DB → save_message_to_api доступна в коде', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = genDB(p, 'f07');
  ok(code.includes('save_message_to_api'), 'save_message_to_api должна быть в коде');
});

test('F08', 'incoming_message_trigger + DB → синтаксис OK с полным проектом', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(genDB(p, 'f08'), 'f08');
});

test('F09', 'incoming_message_trigger без DB → нет INSERT INTO bot_messages в middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f09');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const middlewareBody = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!middlewareBody.includes('INSERT INTO bot_messages'), 'INSERT INTO bot_messages НЕ должен быть в middleware без DB');
});

test('F10', 'incoming_message_trigger + DB + command_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(genDB(p, 'f10'), 'f10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК G: Граничные случаи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок G: Граничные случаи ──────────────────────────────────────');

test('G01', 'пустой проект (нет incoming_message_trigger) → нет middleware функции incoming_message_trigger в коде', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'g01');
  ok(!code.includes('async def incoming_message_trigger'), 'async def incoming_message_trigger НЕ должен быть в коде без триггеров');
});

test('G02', 'только incoming_message_trigger без других узлов → генерация не падает', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1')]);
  let threw = false;
  try { gen(p, 'g02'); } catch { threw = true; }
  ok(!threw, 'генерация не должна падать без целевых узлов');
});

test('G03', 'incoming_message_trigger с пустым autoTransitionTo → игнорируется', () => {
  const node = { ...makeIncomingTriggerNode('imt1', ''), data: { ...makeIncomingTriggerNode('imt1', '').data, autoTransitionTo: '' } };
  const p = makeCleanProject([node]);
  const code = gen(p, 'g03');
  ok(!code.includes('incoming_message_trigger_imt1_middleware'), 'middleware НЕ должен генерироваться для пустого autoTransitionTo');
});

test('G04', 'incoming_message_trigger с null данными → генерация не падает', () => {
  const node = { id: 'imt_null', type: 'incoming_message_trigger', position: { x: 0, y: 0 }, data: null };
  const p = makeCleanProject([node]);
  let threw = false;
  try { gen(p, 'g04'); } catch { threw = true; }
  ok(!threw, 'генерация не должна падать при null данных');
});

test('G05', 'nodeId с спецсимволами → safe_name применяется, синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt-node-1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'g05'), 'g05');
});

test('G06', 'nodeId только из цифр → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('12345', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'g06'), 'g06');
});

test('G07', 'nodeId с дефисами → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('my-incoming-trigger', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'g07'), 'g07');
});

test('G08', 'nodeId с Unicode → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('триггер_1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'g08'), 'g08');
});

test('G09', 'incoming_message_trigger без targetNode в проекте → синтаксис OK', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'ghost_node_not_in_project')]);
  syntax(gen(p, 'g09'), 'g09');
});

test('G10', '50 incoming_message_trigger → синтаксис OK', () => {
  const triggers = Array.from({ length: 50 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  syntax(gen(p, 'g10'), 'g10');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК H: Порядок регистрации
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок H: Порядок регистрации ───────────────────────────────────');

test('H01', 'incoming_message_trigger middleware регистрируется в коде (dp.message.middleware присутствует)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h01');
  ok(code.includes('dp.message.middleware('), 'dp.message.middleware( должен быть в коде');
});

test('H02', 'command_trigger обработчик присутствует вместе с incoming middleware', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h02');
  ok(code.includes('command_trigger_cmd1_handler'), 'command_trigger_cmd1_handler должен быть');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming middleware должен быть');
});

test('H03', 'text_trigger обработчик присутствует вместе с incoming middleware', () => {
  const p = makeCleanProject([
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h03');
  ok(code.includes('@dp.message(lambda'), '@dp.message(lambda должен быть');
  ok(code.includes('incoming_message_trigger_imt1_middleware'), 'incoming middleware должен быть');
});

test('H04', 'incoming_message_trigger middleware содержит return await handler(event, data) — цепочка продолжается', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h04');
  ok(code.includes('return await handler(event, data)'), 'return await handler(event, data) должен быть в middleware');
});

test('H05', 'два incoming_message_trigger → оба dp.message.middleware вызова в коде', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeIncomingTriggerNode('imt2', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h05');
  ok(code.includes('dp.message.middleware(incoming_message_trigger_imt1_middleware)'), 'dp.message.middleware(imt1) должен быть');
  ok(code.includes('dp.message.middleware(incoming_message_trigger_imt2_middleware)'), 'dp.message.middleware(imt2) должен быть');
});

test('H06', 'incoming_message_trigger + command_trigger → @dp.message(Command(...)) есть в коде', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h06');
  ok(code.includes('@dp.message(Command('), '@dp.message(Command(...)) должен быть в коде');
});

test('H07', 'incoming_message_trigger + text_trigger → @dp.message(lambda есть в коде', () => {
  const p = makeCleanProject([
    makeIncomingTriggerNode('imt1', 'msg1'),
    makeTextTriggerNode('txt1', ['привет'], 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'h07');
  ok(code.includes('@dp.message(lambda'), '@dp.message(lambda должен быть в коде');
});

test('H08', 'incoming_message_trigger → есть @dp.message() без аргументов (catch-all хендлер)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h08');
  ok(code.includes('@dp.message()'), '@dp.message() catch-all должен быть в коде');
});

test('H09', 'incoming_message_trigger → имя функции содержит nodeId', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('my_special_node', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h09');
  ok(code.includes('my_special_node'), 'nodeId my_special_node должен быть в имени функции');
});

test('H10', 'incoming_message_trigger → имя функции заканчивается на _middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'h10');
  ok(code.includes('_middleware'), 'имя функции должно заканчиваться на _middleware');
  const fns = code.match(/async def incoming_message_trigger_\w+/g) || [];
  ok(fns.length > 0, 'функция middleware должна быть в коде');
  fns.forEach(fn => ok(fn.endsWith('_middleware'), `Функция ${fn} должна заканчиваться на _middleware`));
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК I: Производительность
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок I: Производительность ────────────────────────────────────');

test('I01', 'генерация 1 триггера < 500ms', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'i01');
  const elapsed = Date.now() - start;
  ok(elapsed < 500, `Генерация заняла ${elapsed}ms, ожидалось < 500ms`);
});

test('I02', 'генерация 10 триггеров < 500ms', () => {
  const triggers = Array.from({ length: 10 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'i02');
  const elapsed = Date.now() - start;
  ok(elapsed < 500, `Генерация заняла ${elapsed}ms, ожидалось < 500ms`);
});

test('I03', 'генерация 50 триггеров < 2000ms', () => {
  const triggers = Array.from({ length: 50 }, (_, i) => makeIncomingTriggerNode(`imt${i}`, 'msg1'));
  const p = makeCleanProject([...triggers, makeMessageNode('msg1')]);
  const start = Date.now();
  gen(p, 'i03');
  const elapsed = Date.now() - start;
  ok(elapsed < 2000, `Генерация заняла ${elapsed}ms, ожидалось < 2000ms`);
});

test('I04', 'генерация с DB < 500ms', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const start = Date.now();
  genDB(p, 'i04');
  const elapsed = Date.now() - start;
  ok(elapsed < 500, `Генерация с DB заняла ${elapsed}ms, ожидалось < 500ms`);
});

test('I05', 'повторная генерация того же проекта < 500ms', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  gen(p, 'i05_warmup'); // прогрев
  const start = Date.now();
  gen(p, 'i05');
  const elapsed = Date.now() - start;
  ok(elapsed < 500, `Повторная генерация заняла ${elapsed}ms, ожидалось < 500ms`);
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК J: Отсутствие лишнего кода
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок J: Отсутствие лишнего кода ──────────────────────────────');

test('J01', 'без incoming_message_trigger → нет async def incoming_message_trigger middleware в коде', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'j01');
  ok(!code.includes('async def incoming_message_trigger'), 'async def incoming_message_trigger НЕ должен быть в коде без триггеров');
});

test('J02', 'incoming_message_trigger → нет @dp.message(Command( в middleware функции', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j02');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('@dp.message(Command('), '@dp.message(Command( НЕ должен быть в middleware');
});

test('J03', 'incoming_message_trigger → нет lambda message: в middleware функции', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j03');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('lambda message:'), 'lambda message: НЕ должен быть в middleware');
});

test('J04', 'incoming_message_trigger → нет adminOnly проверок (узел не поддерживает)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j04');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('is_admin('), 'is_admin( НЕ должен быть в middleware');
});

test('J05', 'incoming_message_trigger → нет requiresAuth проверок', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j05');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('check_auth('), 'check_auth( НЕ должен быть в middleware');
});

test('J06', 'incoming_message_trigger → нет дублирующихся dp.message.middleware вызовов для одного nodeId', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j06');
  const matches = (code.match(/dp\.message\.middleware\(incoming_message_trigger_imt1_middleware\)/g) || []).length;
  ok(matches === 1, `dp.message.middleware(imt1) должен быть ровно 1 раз, найдено: ${matches}`);
});

test('J07', 'incoming_message_trigger → есть @dp.message() без аргументов (catch-all)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j07');
  ok(code.includes('@dp.message()'), '@dp.message() catch-all должен быть в коде');
});

test('J08', 'incoming_message_trigger → нет fallback в middleware', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j08');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('fallback'), 'fallback НЕ должен быть в middleware');
});

test('J09', 'incoming_message_trigger → нет F.text фильтра', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j09');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('F.text'), 'F.text НЕ должен быть в middleware');
});

test('J10', 'incoming_message_trigger → нет F.photo фильтра', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j10');
  const middlewareIdx = code.indexOf('async def incoming_message_trigger_imt1_middleware');
  const nextDefIdx = code.indexOf('\nasync def ', middlewareIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(middlewareIdx, nextDefIdx) : code.substring(middlewareIdx);
  ok(!body.includes('F.photo'), 'F.photo НЕ должен быть в middleware');
});

test('J11', 'incoming_message_trigger → нет "Нет обработчика для узла типа incoming_message_trigger" в коде', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'j11');
  ok(!code.includes('Нет обработчика для узла типа incoming_message_trigger'),
    'узел не должен попадать в общий цикл как необработанный');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК K: Catch-all хендлер для не-текстовых типов сообщений
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок K: Catch-all хендлер для стикеров и прочих типов ─────────');

test('K01', 'содержит @dp.message() без фильтра (catch-all)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k01');
  ok(code.includes('@dp.message()'), '@dp.message() catch-all должен быть в коде');
});

test('K02', 'catch-all хендлер содержит handle_unhandled_message', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k02');
  ok(code.includes('async def handle_unhandled_message'), 'async def handle_unhandled_message должен быть в коде');
});

test('K03', 'catch-all хендлер содержит message.content_type', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k03');
  ok(code.includes('message.content_type'), 'message.content_type должен быть в catch-all хендлере');
});

test('K04', 'catch-all хендлер стоит ПОСЛЕ @dp.message(F.text)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k04');
  const textIdx = code.indexOf('@dp.message(F.text)');
  const catchAllIdx = code.indexOf('@dp.message()');
  ok(textIdx < catchAllIdx, '@dp.message() должен быть после @dp.message(F.text)');
});

test('K05', 'catch-all хендлер стоит ПОСЛЕ @dp.message(F.photo)', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k05');
  const photoIdx = code.indexOf('@dp.message(F.photo)');
  const catchAllIdx = code.indexOf('@dp.message()');
  ok(photoIdx < catchAllIdx, '@dp.message() должен быть после @dp.message(F.photo)');
});

test('K06', 'catch-all хендлер присутствует даже без incoming_message_trigger', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'k06');
  ok(code.includes('@dp.message()'), '@dp.message() должен быть даже без incoming_message_trigger');
});

test('K07', 'catch-all хендлер присутствует с userDatabaseEnabled: true', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = genDB(p, 'k07');
  ok(code.includes('@dp.message()'), '@dp.message() должен быть при userDatabaseEnabled: true');
});

test('K08', 'синтаксис OK с catch-all хендлером', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'k08'), 'k08');
});

test('K09', 'catch-all хендлер содержит logging.info', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k09');
  const catchAllIdx = code.indexOf('async def handle_unhandled_message');
  const nextDefIdx = code.indexOf('\nasync def ', catchAllIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(catchAllIdx, nextDefIdx) : code.substring(catchAllIdx);
  ok(body.includes('logging.info'), 'logging.info должен быть в catch-all хендлере');
});

test('K10', 'catch-all хендлер содержит message.from_user.id', () => {
  const p = makeCleanProject([makeIncomingTriggerNode('imt1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'k10');
  const catchAllIdx = code.indexOf('async def handle_unhandled_message');
  const nextDefIdx = code.indexOf('\nasync def ', catchAllIdx + 1);
  const body = nextDefIdx > 0 ? code.substring(catchAllIdx, nextDefIdx) : code.substring(catchAllIdx);
  ok(body.includes('message.from_user.id'), 'message.from_user.id должен быть в catch-all хендлере');
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
