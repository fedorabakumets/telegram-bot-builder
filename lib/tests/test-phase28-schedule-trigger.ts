/**
 * @fileoverview Интеграционные тесты для узла schedule_trigger (фаза 28)
 *
 * Блок A: Базовая генерация фоновой задачи
 * Блок B: Режимы расписания (interval, weekday, monthday, cron)
 * Блок C: Целевые узлы
 * Блок D: Взаимодействие с другими триггерами
 * Блок E: FakeCallbackQuery структура
 * Блок F: Персистентность в БД
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
  return generatePythonCode(project as any, { botName: `Phase28_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function genDB(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase28DB_${label}`, userDatabaseEnabled: true, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p28_${label}.py`;
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

/** Создаёт узел schedule_trigger */
function makeScheduleNode(id: string, targetId: string, opts: any = {}) {
  return {
    id,
    type: 'schedule_trigger',
    position: { x: 0, y: 0 },
    data: {
      rules: opts.rules || [{ mode: 'interval', intervalMinutes: 5 }],
      timezone: opts.timezone || 'Europe/Moscow',
      autoTransitionTo: targetId,
      runOnStart: opts.runOnStart ?? false,
      enabled: opts.enabled ?? true,
      maxConcurrent: opts.maxConcurrent ?? 1,
      buttons: [],
      keyboardType: 'none',
    },
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

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 28 — Узел schedule_trigger (Запуск по таймеру)       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация фоновой задачи
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация фоновой задачи ──────────────────────');

test('A01', 'schedule_trigger + autoTransitionTo → генерируется async def _schedule_task_', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('async def _schedule_task_sched1'), 'async def _schedule_task_sched1 должен быть в коде');
});

test('A02', 'содержит функцию _calc_delay_', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a02');
  ok(code.includes('def _calc_delay_sched1'), '_calc_delay_sched1 должен быть в коде');
});

test('A03', 'содержит async def _schedule_execute_', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a03');
  ok(code.includes('async def _schedule_execute_sched1'), '_schedule_execute_sched1 должен быть в коде');
});

test('A04', 'содержит _schedule_tasks.append', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('_schedule_tasks.append'), '_schedule_tasks.append должен быть в коде');
});

test('A05', 'содержит asyncio.ensure_future', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('asyncio.ensure_future'), 'asyncio.ensure_future должен быть в коде');
});

test('A06', 'содержит import pytz', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('import pytz'), 'import pytz должен быть в коде');
});

test('A07', 'содержит timezone из параметров', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { timezone: 'Asia/Tokyo' }), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('Asia/Tokyo'), 'timezone Asia/Tokyo должен быть в коде');
});

test('A08', 'содержит logging.info с nodeId', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a08');
  ok(code.includes('logging.info') && code.includes('sched1'), 'logging.info с sched1 должен быть в коде');
});

test('A09', 'содержит logging.error для обработки исключений', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a09');
  ok(code.includes('logging.error'), 'logging.error должен быть в коде');
});

test('A10', 'без autoTransitionTo → триггер игнорируется', () => {
  const node = makeScheduleNode('sched1', '');
  const p = makeCleanProject([node]);
  const code = gen(p, 'a10');
  ok(!code.includes('_schedule_task_sched1'), '_schedule_task НЕ должен быть без autoTransitionTo');
});

test('A11', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a11'), 'a11');
});

test('A12', 'runOnStart=true → содержит await _schedule_execute_ перед циклом', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { runOnStart: true }), makeMessageNode('msg1')]);
  const code = gen(p, 'a12');
  ok(code.includes('await _schedule_execute_sched1()'), 'await _schedule_execute_sched1() должен быть при runOnStart');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Режимы расписания
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок B: Режимы расписания ─────────────────────────────────────');

test('B01', 'interval mode → содержит расчёт интервала в секундах', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'interval', intervalMinutes: 10 }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('10 * 60'), '10 * 60 должен быть в коде');
});

test('B02', 'weekday mode → содержит day_map', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'weekday', days: ['mon', 'fri'], hour: 9, minute: 0 }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('_day_map'), '_day_map должен быть в коде');
});

test('B03', 'weekday mode → синтаксис OK', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'weekday', days: ['mon', 'wed', 'fri'], hour: 9, minute: 30 }] }), makeMessageNode('msg1')]);
  syntax(gen(p, 'b03'), 'b03');
});

test('B04', 'monthday mode → содержит target_days_m', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'monthday', monthDays: [1, 15], hour: 10, minute: 0 }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b04');
  ok(code.includes('_target_days_m'), '_target_days_m должен быть в коде');
});

test('B05', 'monthday mode → синтаксис OK', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'monthday', monthDays: [1, 15], hour: 10, minute: 0 }] }), makeMessageNode('msg1')]);
  syntax(gen(p, 'b05'), 'b05');
});

test('B06', 'cron mode → содержит croniter', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'cron', cronExpression: '*/5 9-18 * * 1-5' }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b06');
  ok(code.includes('croniter'), 'croniter должен быть в коде');
});

test('B07', 'cron mode → содержит cron-выражение из параметров', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'cron', cronExpression: '0 9 * * 1' }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b07');
  ok(code.includes('0 9 * * 1'), 'cron-выражение должно быть в коде');
});

test('B08', 'cron mode → синтаксис OK', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'cron', cronExpression: '*/10 * * * *' }] }), makeMessageNode('msg1')]);
  syntax(gen(p, 'b08'), 'b08');
});

test('B09', 'interval 1 мин → содержит 1 * 60', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'interval', intervalMinutes: 1 }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b09');
  ok(code.includes('1 * 60'), '1 * 60 должен быть в коде');
});

test('B10', 'interval 60 мин → содержит 60 * 60', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'interval', intervalMinutes: 60 }] }), makeMessageNode('msg1')]);
  const code = gen(p, 'b10');
  ok(code.includes('60 * 60'), '60 * 60 должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Целевые узлы
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок C: Целевые узлы ──────────────────────────────────────────');

test('C01', 'targetId = message → handle_callback_<id> в коде', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg_target'), makeMessageNode('msg_target')]);
  const code = gen(p, 'c01');
  ok(code.includes('handle_callback_msg_target'), 'handle_callback_msg_target должен быть в коде');
});

test('C02', 'targetId = condition → handle_callback_<id> в коде', () => {
  const condNode = { id: 'cond1', type: 'condition', position: { x: 0, y: 0 }, data: { conditions: [], defaultTargetId: '', buttons: [], keyboardType: 'none' } };
  const p = makeCleanProject([makeScheduleNode('sched1', 'cond1'), condNode]);
  const code = gen(p, 'c02');
  ok(code.includes('handle_callback_cond1'), 'handle_callback_cond1 должен быть в коде');
});

test('C03', 'targetId с дефисами → корректное имя функции', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'my-target-node'), makeMessageNode('my-target-node')]);
  const code = gen(p, 'c03');
  ok(code.includes('handle_callback_my_target_node'), 'handle_callback_my_target_node должен быть в коде');
});

test('C04', 'несуществующий targetId → генерация не падает', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'nonexistent_xyz')]);
  let threw = false;
  try { gen(p, 'c04'); } catch { threw = true; }
  ok(!threw, 'генерация не должна падать при несуществующем targetId');
});

test('C05', 'несколько schedule_trigger → несколько задач', () => {
  const p = makeCleanProject([
    makeScheduleNode('sched1', 'msg1'),
    makeScheduleNode('sched2', 'msg2'),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]);
  const code = gen(p, 'c05');
  ok(code.includes('_schedule_task_sched1'), '_schedule_task_sched1 должен быть');
  ok(code.includes('_schedule_task_sched2'), '_schedule_task_sched2 должен быть');
});

test('C06', 'несколько schedule_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'interval', intervalMinutes: 5 }] }),
    makeScheduleNode('sched2', 'msg2', { rules: [{ mode: 'interval', intervalMinutes: 10 }] }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]);
  syntax(gen(p, 'c06'), 'c06');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Взаимодействие с другими триггерами
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок D: Взаимодействие с другими триггерами ───────────────────');

test('D01', 'command_trigger + schedule_trigger → оба в коде', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeScheduleNode('sched1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd01');
  ok(code.includes('CommandStart('), 'command_trigger должен быть в коде');
  ok(code.includes('_schedule_task_sched1'), 'schedule_trigger должен быть в коде');
});

test('D02', 'command_trigger + schedule_trigger → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeScheduleNode('sched1', 'msg1'),
    makeMessageNode('msg1'),
  ]);
  syntax(gen(p, 'd02'), 'd02');
});

test('D03', 'schedule_trigger не генерирует @dp.message', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'd03');
  // Ищем в блоке schedule_trigger — не должно быть @dp.message
  const schedIdx = code.indexOf('_schedule_task_sched1');
  const schedBlock = code.substring(schedIdx, schedIdx + 2000);
  ok(!schedBlock.includes('@dp.message('), '@dp.message НЕ должен быть в schedule_trigger блоке');
});

test('D04', 'schedule_trigger не генерирует dp.message.middleware с sched', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'd04');
  ok(!code.includes('dp.message.middleware(schedule') && !code.includes('dp.message.middleware(sched'), 'dp.message.middleware для schedule НЕ должен быть');
});

test('D05', 'полный проект: command + schedule + message → синтаксис OK', () => {
  const p = makeCleanProject([
    makeCommandTriggerNode('cmd1', '/start', 'msg1'),
    makeCommandTriggerNode('cmd2', '/help', 'msg2'),
    makeScheduleNode('sched1', 'msg1', { rules: [{ mode: 'interval', intervalMinutes: 5 }] }),
    makeMessageNode('msg1', 'Привет!'),
    makeMessageNode('msg2', 'Помощь'),
  ]);
  syntax(gen(p, 'd05'), 'd05');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: FakeCallbackQuery структура
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок E: FakeCallbackQuery структура ───────────────────────────');

test('E01', 'содержит class _SchedCb с self.data = targetNodeId', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e01');
  ok(code.includes('self.data = "msg1"'), 'self.data = "msg1" должен быть в коде');
});

test('E02', 'содержит self.from_user = types.User', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e02');
  ok(code.includes('self.from_user = types.User('), 'self.from_user = types.User( должен быть в коде');
});

test('E03', 'содержит self.message = None', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e03');
  ok(code.includes('self.message = None'), 'self.message = None должен быть в коде');
});

test('E04', 'содержит self._is_fake = True', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e04');
  ok(code.includes('self._is_fake = True'), 'self._is_fake = True должен быть в коде');
});

test('E05', 'содержит async def answer', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'e05');
  ok(code.includes('async def answer'), 'async def answer должен быть в коде');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Персистентность в БД
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок F: Персистентность в БД ──────────────────────────────────');

test('F01', 'содержит SELECT last_run_at из schedule_state', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f01');
  ok(code.includes('SELECT last_run_at'), 'SELECT last_run_at должен быть в коде');
});

test('F02', 'содержит INSERT INTO schedule_state', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f02');
  ok(code.includes('INSERT INTO schedule_state'), 'INSERT INTO schedule_state должен быть в коде');
});

test('F03', 'содержит UPDATE schedule_state', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f03');
  ok(code.includes('UPDATE schedule_state'), 'UPDATE schedule_state должен быть в коде');
});

test('F04', 'содержит db_pool', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f04');
  ok(code.includes('db_pool'), 'db_pool должен быть в коде');
});

test('F05', 'содержит PROJECT_ID и TOKEN_ID', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f05');
  ok(code.includes('PROJECT_ID') && code.includes('TOKEN_ID'), 'PROJECT_ID и TOKEN_ID должны быть в коде');
});

test('F06', 'содержит last_status (success/error)', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f06');
  ok(code.includes("'error'") && code.includes("'success'"), 'last_status error/success должны быть в коде');
});

test('F07', 'userDatabaseEnabled: true + schedule_trigger → синтаксис OK', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  syntax(genDB(p, 'f07'), 'f07');
});

test('F08', 'содержит user_data[_sched_user_id]["_schedule"]', () => {
  const p = makeCleanProject([makeScheduleNode('sched1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'f08');
  ok(code.includes('user_data[_sched_user_id]["_schedule"]'), 'user_data[_sched_user_id]["_schedule"] должен быть в коде');
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

console.log('\n✅ Все тесты фазы 28 (schedule_trigger) пройдены!\n');
