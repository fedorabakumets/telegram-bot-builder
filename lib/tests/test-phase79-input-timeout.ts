/**
 * @fileoverview Фазовые тесты таймаута ожидания ввода и общей отмены (phase79)
 *
 * Блок A: Генерация таймаута (8 проверок)
 * Блок B: Отмена формы (4 проверки)
 * Блок C: Совместимость (3 проверки)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/**
 * Создаёт минимальный проект с одним листом.
 * @param nodes - Узлы проекта
 * @returns Объект проекта для генератора
 */
function makeCleanProject(nodes: unknown[]) {
  return {
    sheets: [{
      id: 'sheet1',
      name: 'Test',
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
    version: 2,
    activeSheetId: 'sheet1',
  };
}

/**
 * Генерирует Python-код проекта.
 * @param project - Проект бота
 * @param label - Метка для временного файла
 * @returns Сгенерированный Python-код
 */
function gen(project: unknown, label: string): string {
  return generatePythonCode(project as any, { botName: `Phase79_${label}`, userDatabaseEnabled: false });
}

/**
 * Проверяет синтаксис Python-кода.
 * @param code - Python-код
 * @param label - Метка временного файла
 */
function syntax(code: string, label: string) {
  const tmp = `_tmp_p79_${label}.py`;
  fs.writeFileSync(tmp, code, 'utf-8');
  try {
    execSync(`python -m py_compile ${tmp}`, { stdio: 'pipe' });
    fs.unlinkSync(tmp);
  } catch (e: any) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new Error(e.stderr?.toString() ?? String(e));
  }
}

/**
 * Создаёт input-узел с опциональным таймаутом.
 * @param id - ID узла
 * @param targetId - ID следующего узла
 * @param extra - Дополнительные поля data
 */
function makeInputNode(id: string, targetId: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: 'input',
    position: { x: 0, y: 0 },
    data: {
      inputType: 'text',
      inputVariable: 'answer',
      inputTargetNodeId: targetId,
      collectUserInput: true,
      enableTextInput: true,
      buttons: [],
      keyboardType: 'none',
      ...extra,
    },
  };
}

/**
 * Создаёт message-узел.
 * @param id - ID узла
 */
function makeMessageNode(id: string) {
  return {
    id,
    type: 'message',
    position: { x: 400, y: 0 },
    data: {
      messageText: 'OK',
      buttons: [],
      keyboardType: 'none',
      formatMode: 'none',
      markdown: false,
    },
  };
}

type R = { id: string; name: string; passed: boolean; note: string };
const results: R[] = [];

/**
 * Запускает один фазовый тест.
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Тело теста
 */
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

/** Проверяет условие. */
function ok(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   Тест phase79 — input timeout и отмена формы                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('── Блок A: Генерация таймаута ───────────────────────────────────');

test('A01', 'waiting_for_input содержит timeout_seconds', () => {
  const p = makeCleanProject([
    makeInputNode('inp1', 'msg1', { inputTimeout: 90, inputTimeoutMessage: 'Слишком долго.' }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a01');
  ok(code.includes('"timeout_seconds": 90'), 'timeout_seconds=90');
  ok(code.includes('Слишком долго.'), 'timeout_message');
});

test('A02', 'вызывается _schedule_input_timeout', () => {
  const p = makeCleanProject([
    makeInputNode('inp1', 'msg1', { inputTimeout: 60 }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a02');
  ok(code.includes('await _schedule_input_timeout(user_id, 60'), '_schedule_input_timeout');
});

test('A03', 'utils содержит _input_timeout_tasks', () => {
  const p = makeCleanProject([
    makeInputNode('inp1', 'msg1', { inputTimeout: 30 }),
    makeMessageNode('msg1'),
  ]);
  const code = gen(p, 'a03');
  ok(code.includes('_input_timeout_tasks'), '_input_timeout_tasks');
});

test('A04', 'utils содержит _schedule_input_timeout', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1', { inputTimeout: 30 }), makeMessageNode('msg1')]);
  const code = gen(p, 'a04');
  ok(code.includes('async def _schedule_input_timeout'), 'def _schedule_input_timeout');
});

test('A05', 'utils содержит _cancel_input_timeout_task', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1', { inputTimeout: 30 }), makeMessageNode('msg1')]);
  const code = gen(p, 'a05');
  ok(code.includes('async def _cancel_input_timeout_task'), 'def _cancel_input_timeout_task');
});

test('A06', 'utils содержит _track_form_variable и _clear_form_session', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1', { inputTimeout: 30 }), makeMessageNode('msg1')]);
  const code = gen(p, 'a06');
  ok(code.includes('def _track_form_variable'), '_track_form_variable');
  ok(code.includes('async def _clear_form_session'), '_clear_form_session');
});

test('A07', 'handle-user-input отменяет таймер при успешном вводе', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1', { inputTimeout: 45 }), makeMessageNode('msg1')]);
  const code = gen(p, 'a07');
  ok(code.includes('await _cancel_input_timeout_task(user_id)'), 'cancel timeout on success');
  ok(code.includes('_track_form_variable(user_id, variable_name)'), 'track variable');
});

test('A08', 'синтаксис Python OK', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1', { inputTimeout: 45 }), makeMessageNode('msg1')]);
  syntax(gen(p, 'a08'), 'a08');
});

console.log('── Блок B: Отмена формы ─────────────────────────────────────────');

test('B01', 'Command("cancel") при сборе ввода', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b01');
  ok(code.includes('Command("cancel")'), 'cancel command handler');
});

test('B02', 'cancel вызывает _clear_form_session', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b02');
  ok(code.includes('await _clear_form_session(user_id)'), '_clear_form_session');
});

test('B03', 'cancel отвечает «Форма отменена.»', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'b03');
  ok(code.includes('Форма отменена.'), 'cancel message');
});

test('B04', 'без сбора ввода нет cancel handler', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'b04');
  ok(!code.includes('handle_cancel_input_form'), 'no cancel handler');
});

console.log('── Блок C: Совместимость ────────────────────────────────────────');

test('C01', 'без inputTimeout нет _schedule_input_timeout в input-узле', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1'), makeMessageNode('msg1')]);
  const code = gen(p, 'c01');
  ok(code.includes('waiting_for_input'), 'waiting_for_input сохранён');
  ok(!code.includes('await _schedule_input_timeout'), 'нет планировщика');
  ok(!code.includes('timeout_seconds'), 'нет timeout_seconds');
});

test('C02', 'без сбора ввода нет _input_timeout_tasks', () => {
  const p = makeCleanProject([makeMessageNode('msg1')]);
  const code = gen(p, 'c02');
  ok(!code.includes('_input_timeout_tasks'), 'нет _input_timeout_tasks');
});

test('C03', 'legacy input без timeout полей компилируется', () => {
  const p = makeCleanProject([makeInputNode('inp1', 'msg1'), makeMessageNode('msg1')]);
  syntax(gen(p, 'c03'), 'c03');
});

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\nИтого: ${passed} passed, ${failed} failed из ${results.length}`);
if (failed > 0) process.exit(1);
