/**
 * @fileoverview Интеграционные тесты для узла parallel_split (фаза 65)
 *
 * Блок A: Базовая генерация
 * Блок B: Защита от двойного запуска (skipIfRunning)
 * Блок C: Режимы awaitAll и maxConcurrent
 * Блок D: Фоллбек при ошибке ветки (onErrorTarget)
 * Блок E: Атомарный инкремент set_variable (Lock)
 * Блок F: Граничные случаи и полные сценарии
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
  return generatePythonCode(project as any, { botName: `Phase65_${label}`, userDatabaseEnabled: false, enableComments: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p65_${label}.py`;
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

/** Создаёт узел parallel_split */
function makeSplitNode(id: string, opts: any = {}) {
  return {
    id, type: 'parallel_split', position: { x: 0, y: 0 },
    data: {
      parallelBranches: opts.parallelBranches || [],
      maxConcurrent: opts.maxConcurrent ?? 5,
      awaitAll: opts.awaitAll ?? false,
      skipIfRunning: opts.skipIfRunning ?? true,
    },
  };
}

/** Создаёт message-узел */
function makeMessageNode(id: string, text = 'test') {
  return { id, type: 'message', position: { x: 0, y: 0 }, data: { messageText: text, buttons: [], keyboardType: 'none' } };
}

/** Создаёт set_variable узел с expression-присваиванием */
function makeSetVarNode(id: string, variable: string, value: string) {
  return {
    id, type: 'set_variable', position: { x: 0, y: 0 },
    data: { assignments: [{ id: 'a1', variable, value, mode: 'expression' }], autoTransitionTo: '', buttons: [], keyboardType: 'none' },
  };
}

/** Создаёт command_trigger узел */
function makeCommandTrigger(id: string, cmd: string, target: string) {
  return { id, type: 'command_trigger', position: { x: 0, y: 0 }, data: { command: cmd, autoTransitionTo: target, enableAutoTransition: true, description: '', showInMenu: true, adminOnly: false, requiresAuth: false, buttons: [], keyboardType: 'none' } };
}

/** Стандартный проект: split с двумя ветками-сообщениями */
function makeStandardProject(splitOpts: any = {}) {
  return makeCleanProject([
    makeSplitNode('split1', {
      parallelBranches: [
        { id: 'br1', label: 'Первая', target: 'msg1' },
        { id: 'br2', label: 'Вторая', target: 'msg2' },
      ],
      ...splitOpts,
    }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]);
}

// ─── Шапка ───────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Фаза 65 — Узел parallel_split (параллельный запуск)        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// БЛОК A: Базовая генерация
// ════════════════════════════════════════════════════════════════════════════

console.log('── Блок A: Базовая генерация ─────────────────────────────────────');

test('A01', 'split node → генерируется handle_callback_', () => {
  const code = gen(makeStandardProject(), 'a01');
  ok(code.includes('async def handle_callback_split1'), 'handle_callback_split1 должен быть в коде');
});

test('A02', 'содержит @dp.callback_query с ID ноды', () => {
  const code = gen(makeStandardProject(), 'a02');
  ok(code.includes('@dp.callback_query(lambda c: c.data == "split1")'), 'декоратор с ID должен быть в коде');
});

test('A03', 'вызывает обработчики обеих веток', () => {
  const code = gen(makeStandardProject(), 'a03');
  ok(code.includes('_run_branch(handle_callback_msg1'), 'вызов ветки msg1');
  ok(code.includes('_run_branch(handle_callback_msg2'), 'вызов ветки msg2');
});

test('A04', 'содержит asyncio.gather с return_exceptions', () => {
  const code = gen(makeStandardProject(), 'a04');
  ok(code.includes('return_exceptions=True'), 'gather с return_exceptions');
});

test('A05', 'содержит реестр _active_splits (один раз)', () => {
  const code = gen(makeStandardProject(), 'a05');
  const matches = code.match(/_active_splits: set = set\(\)/g) || [];
  ok(matches.length === 1, `реестр должен быть ровно один раз, найдено: ${matches.length}`);
});

test('A06', 'синтаксис Python валиден', () => {
  const code = gen(makeStandardProject(), 'a06');
  syntax(code, 'a06');
});

test('A07', 'нет дублирующего обработчика от interactive-callback-handlers', () => {
  const code = gen(makeStandardProject(), 'a07');
  const matches = code.match(/async def handle_callback_split1\(/g) || [];
  ok(matches.length === 1, `обработчик должен быть один, найдено: ${matches.length}`);
});

test('A08', 'логирование запуска и завершения веток', () => {
  const code = gen(makeStandardProject(), 'a08');
  ok(code.includes('запуск 2 веток'), 'лог запуска');
  ok(code.includes('все ветки завершены'), 'лог завершения');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК B: Защита от двойного запуска (skipIfRunning)
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок B: skipIfRunning ─────────────────────────────────────────');

test('B01', 'skipIfRunning=true → проверка _split_key', () => {
  const code = gen(makeStandardProject({ skipIfRunning: true }), 'b01');
  ok(code.includes('_split_key in _active_splits'), 'проверка ключа');
  ok(code.includes('Уже выполняется'), 'ответ пользователю');
});

test('B02', 'skipIfRunning=true → discard в finally супервизора', () => {
  const code = gen(makeStandardProject({ skipIfRunning: true }), 'b02');
  ok(code.includes('_active_splits.discard(_split_key)'), 'снятие ключа');
});

test('B03', 'skipIfRunning=false → нет проверки ключа', () => {
  const code = gen(makeStandardProject({ skipIfRunning: false }), 'b03');
  ok(!code.includes('_split_key in _active_splits'), 'проверки быть не должно');
});

test('B04', 'skipIfRunning по умолчанию включён', () => {
  const p = makeCleanProject([
    { id: 'split1', type: 'parallel_split', position: { x: 0, y: 0 }, data: { parallelBranches: [{ id: 'br1', label: '', target: 'msg1' }] } },
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'b04');
  ok(code.includes('_split_key in _active_splits'), 'дефолт должен включать защиту');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК C: Режимы awaitAll и maxConcurrent
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок C: awaitAll и maxConcurrent ──────────────────────────────');

test('C01', 'awaitAll=false → create_task супервизора', () => {
  const code = gen(makeStandardProject({ awaitAll: false }), 'c01');
  ok(code.includes('asyncio.create_task(_run_all())'), 'fire-and-forget');
});

test('C02', 'awaitAll=true → await супервизора', () => {
  const code = gen(makeStandardProject({ awaitAll: true }), 'c02');
  ok(code.includes('await _run_all()'), 'ожидание супервизора');
  ok(!code.includes('asyncio.create_task(_run_all())'), 'без create_task');
});

test('C03', 'maxConcurrent=3 → Semaphore(3)', () => {
  const code = gen(makeStandardProject({ maxConcurrent: 3 }), 'c03');
  ok(code.includes('asyncio.Semaphore(3)'), 'семафор с лимитом');
});

test('C04', 'maxConcurrent=0 → большой семафор (без лимита)', () => {
  const code = gen(makeStandardProject({ maxConcurrent: 0 }), 'c04');
  ok(code.includes('asyncio.Semaphore(999)'), 'семафор без лимита');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК D: Фоллбек при ошибке ветки (onErrorTarget)
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок D: onErrorTarget ─────────────────────────────────────────');

test('D01', 'onErrorTarget → фоллбек передаётся в _run_branch', () => {
  const p = makeCleanProject([
    makeSplitNode('split1', {
      parallelBranches: [{ id: 'br1', label: 'X', target: 'msg1', onErrorTarget: 'msg_err' }],
    }),
    makeMessageNode('msg1'),
    makeMessageNode('msg_err'),
  ]);
  const code = gen(p, 'd01');
  ok(code.includes('_run_branch(handle_callback_msg1, "X", handle_callback_msg_err)'), 'фоллбек третьим аргументом');
});

test('D02', 'onErrorTarget на несуществующую ноду → игнорируется', () => {
  const p = makeCleanProject([
    makeSplitNode('split1', {
      parallelBranches: [{ id: 'br1', label: 'X', target: 'msg1', onErrorTarget: 'ghost' }],
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'd02');
  ok(!code.includes('handle_callback_ghost'), 'фоллбек-призрак игнорируется');
  syntax(code, 'd02');
});

test('D03', 'обёртка _run_branch ловит ошибки веток', () => {
  const code = gen(makeStandardProject(), 'd03');
  ok(code.includes('except Exception as _br_err'), 'try/except вокруг ветки');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК E: Атомарный инкремент set_variable (Lock)
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок E: Атомарный инкремент ───────────────────────────────────');

test('E01', 'utils содержит _get_user_var_lock', () => {
  const code = gen(makeStandardProject(), 'e01');
  ok(code.includes('def _get_user_var_lock(user_id: int)'), 'хелпер лока');
  ok(code.includes('_user_var_locks'), 'словарь локов');
});

test('E02', 'set_variable expression → под локом', () => {
  const p = makeCleanProject([
    makeSplitNode('split1', {
      parallelBranches: [
        { id: 'br1', label: '', target: 'setv1' },
        { id: 'br2', label: '', target: 'setv2' },
      ],
    }),
    makeSetVarNode('setv1', 'done_count', 'int({done_count}) + 1'),
    makeSetVarNode('setv2', 'done_count', 'int({done_count}) + 1'),
  ]);
  const code = gen(p, 'e02');
  ok(code.includes('async with _get_user_var_lock(user_id):'), 'инкремент под локом');
  syntax(code, 'e02');
});

// ════════════════════════════════════════════════════════════════════════════
// БЛОК F: Граничные случаи и полные сценарии
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Блок F: Граничные случаи ──────────────────────────────────────');

test('F01', 'split без веток → warning-заглушка, синтаксис валиден', () => {
  const p = makeCleanProject([makeSplitNode('split1', { parallelBranches: [] })]);
  const code = gen(p, 'f01');
  ok(code.includes('нет веток с целевыми нодами'), 'warning о пустых ветках');
  syntax(code, 'f01');
});

test('F02', 'ветка на несуществующую ноду → отбрасывается', () => {
  const p = makeCleanProject([
    makeSplitNode('split1', {
      parallelBranches: [
        { id: 'br1', label: '', target: 'msg1' },
        { id: 'br2', label: '', target: 'ghost' },
      ],
    }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'f02');
  ok(code.includes('запуск 1 веток'), 'осталась одна ветка');
  syntax(code, 'f02');
});

test('F03', 'два split-узла → реестр один, обработчика два', () => {
  const p = makeCleanProject([
    makeSplitNode('split1', { parallelBranches: [{ id: 'b1', label: '', target: 'msg1' }] }),
    makeSplitNode('split2', { parallelBranches: [{ id: 'b1', label: '', target: 'msg2' }] }),
    makeMessageNode('msg1'),
    makeMessageNode('msg2'),
  ]);
  const code = gen(p, 'f03');
  const registries = code.match(/_active_splits: set = set\(\)/g) || [];
  ok(registries.length === 1, `реестр один раз, найдено: ${registries.length}`);
  ok(code.includes('handle_callback_split1') && code.includes('handle_callback_split2'), 'оба обработчика');
  syntax(code, 'f03');
});

test('F04', 'полный сценарий: триггер → split → ветки → сбор через set_variable', () => {
  const p = makeCleanProject([
    makeCommandTrigger('trig1', '/run', 'split1'),
    makeSplitNode('split1', {
      parallelBranches: [
        { id: 'br1', label: 'A', target: 'msg1' },
        { id: 'br2', label: 'B', target: 'setv1' },
      ],
      awaitAll: false,
    }),
    makeMessageNode('msg1'),
    makeSetVarNode('setv1', 'done', 'int({done}) + 1'),
  ]);
  const code = gen(p, 'f04');
  ok(code.includes('handle_callback_split1'), 'обработчик split');
  syntax(code, 'f04');
});

test('F05', 'ID с дефисами → безопасные имена функций', () => {
  const p = makeCleanProject([
    makeSplitNode('split-node-1', { parallelBranches: [{ id: 'b1', label: '', target: 'msg-target-1' }] }),
    makeMessageNode('msg-target-1'),
  ]);
  const code = gen(p, 'f05');
  ok(code.includes('async def handle_callback_split_node_1'), 'безопасное имя split');
  ok(code.includes('_run_branch(handle_callback_msg_target_1'), 'безопасное имя цели');
  syntax(code, 'f05');
});

// ─── Итоги ───────────────────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.length - passed;
console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`Итого: ${passed}/${results.length} прошло, ${failed} упало`);
if (failed > 0) {
  console.log('\nУпавшие тесты:');
  results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.id}. ${r.name}: ${r.note}`));
  process.exit(1);
}
process.exit(0);
