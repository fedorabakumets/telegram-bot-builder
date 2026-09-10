/**
 * @fileoverview Фазовые тесты узла rate_counter (phase78)
 *
 * Блок A: Генерация обработчика
 * Блок B: Импорты и глобальное хранилище
 * Блок C: Поля counterKey, windowSeconds, saveResultTo
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

function makeCleanProject(nodes: unknown[]) {
  return {
    sheets: [{ id: 'sheet1', name: 'Test', nodes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), viewState: { pan: { x: 0, y: 0 }, zoom: 100 } }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase78_${label}`, userDatabaseEnabled: false });
}

function checkSyntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p78_${label}.py`;
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

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
    console.log(`  ✅ ${id}. ${name}`);
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message });
    console.log(`  ❌ ${id}. ${name}\n     → ${e.message}`);
  }
}

function ok(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }
function syntax(code: string, label: string) {
  const r = checkSyntax(code, label);
  ok(r.ok, `Синтаксическая ошибка:\n${r.error}`);
}

function makeRateCounterNode(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'rate_counter',
    position: { x: 0, y: 0 },
    data: {
      counterKey: 'spam_key',
      windowSeconds: '60',
      saveResultTo: 'spam_count',
      autoTransitionTo: targetId,
      ...extra,
    },
  };
}

function makeMessageNode(id: string) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: { messageText: 'OK', buttons: [], keyboardType: 'none', formatMode: 'none', markdown: false },
  };
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест phase78 — rate_counter                                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Генерация обработчика ────────────────────────────────');

test('A01', 'rate_counter → handle_callback и deque', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('handle_callback_rc1'), 'обработчик rc1');
  ok(code.includes('_rate_counter_deques'), 'глобальный deque');
  ok(code.includes('deque()'), 'создание deque');
  ok(code.includes('time.time()'), 'time.time()');
});

test('A02', 'popleft очищает устаревшие записи', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'a01');
  ok(code.includes('popleft()'), 'очистка deque');
});

test('A03', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'a03'), 'a03');
});

console.log('── Блок B: Импорты и config ─────────────────────────────────────');

test('B01', 'hasRateCounterNodes → from collections import deque', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('from collections import deque'), 'import deque');
  ok(code.includes('import time'), 'import time');
});

test('B02', 'без rate_counter → нет _rate_counter_deques', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(!code.includes('_rate_counter_deques'), 'не должно быть _rate_counter_deques');
});

console.log('── Блок C: Поля узла ────────────────────────────────────────────');

test('C01', 'saveResultTo сохраняется в user_data', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1', { saveResultTo: 'my_rate' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('"my_rate"'), 'переменная my_rate');
});

test('C02', 'counterKey подставляется', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1', { counterKey: 'user_spam' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c02');
  ok(code.includes('user_spam'), 'ключ user_spam');
});

test('C03', 'autoTransitionTo → handle_callback целевого узла', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c03');
  ok(code.includes('handle_callback_msg1'), 'переход к msg1');
});

test('C04', 'windowSeconds в replace_variables_in_text', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1', { windowSeconds: '30' }), makeMessageNode('msg1')]);
  const code = gen(p, 'c04');
  ok(code.includes('"30"'), 'окно 30 секунд');
});

test('C05', 'rate_counter → ровно один handle_callback_rc1 (без заглушки)', () => {
  const p = makeCleanProject([makeRateCounterNode('rc1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c05');
  const defs = code.match(/async def handle_callback_rc1\(/g) || [];
  ok(defs.length === 1, `ожидали 1 def handle_callback_rc1, получили ${defs.length}`);
  ok(code.includes('_rate_counter_deques'), 'живой handler должен содержать deque');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\nИтог phase78: ${passed}/${results.length} пройдено, провалено: ${failed}\n`);
if (failed > 0) process.exit(1);
