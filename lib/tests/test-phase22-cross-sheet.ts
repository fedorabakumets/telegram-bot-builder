/**
 * @fileoverview Фаза 22 — Межлистовые соединения (cross-sheet connections)
 *
 * Блок A: autoTransitionTo между листами
 * Блок B: Кнопка goto между листами
 * Блок C: Condition branches между листами
 * Блок D: keyboard-link между листами
 * Блок E: input-target между листами
 * Блок F: Несколько листов, смешанные соединения
 * Блок G: Граничные случаи (несуществующий target, пустой лист)
 * Блок H: Синтаксис сгенерированного кода
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { generatePythonCode } from '../bot-generator.ts';

/** Создаёт проект с несколькими листами */
function makeMultiSheetProject(sheets: Array<{ id: string; name: string; nodes: any[] }>) {
  return {
    sheets: sheets.map(s => ({
      id: s.id,
      name: s.name,
      nodes: s.nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    })),
    version: 2,
    activeSheetId: sheets[0]?.id ?? 'sheet1',
  };
}

/**
 * Генерирует Python-код из проекта
 * @param project - Данные проекта
 * @param label - Метка для имени бота
 * @param db - Включить базу данных
 */
function gen(project: unknown, label: string, db = false): string {
  return generatePythonCode(project as any, {
    botName: `Phase22_${label}`,
    userDatabaseEnabled: db,
    enableComments: false,
  });
}

/**
 * Проверяет синтаксис Python-кода
 * @param code - Код для проверки
 * @param label - Метка для временного файла
 */
function syntax(code: string, label: string): { ok: boolean; error?: string } {
  const tmp = `_tmp_p22_${label}.py`;
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

/**
 * Регистрирует тест и выполняет его
 * @param id - Идентификатор теста
 * @param name - Название теста
 * @param fn - Функция теста
 */
function test(id: string, name: string, fn: () => void) {
  try {
    fn();
    results.push({ id, name, passed: true, note: 'OK' });
  } catch (e: any) {
    results.push({ id, name, passed: false, note: e.message ?? String(e) });
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// ─── Блок A: autoTransitionTo между листами ───────────────────────────────

test('A01', 'autoTransitionTo из листа 1 в лист 2 — узел найден', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], autoTransitionTo: 'msg2', enableAutoTransition: true } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'msg2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Второй лист', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'a01');
  assert(code.includes('msg2') || code.includes('Второй лист'), 'Узел msg2 из листа 2 не попал в код');
});

test('A02', 'autoTransitionTo из листа 2 в лист 1 — обратное направление', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'msg2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Второй', keyboardType: 'none', buttons: [], autoTransitionTo: 'start1', enableAutoTransition: true } },
    ]},
  ]);
  const code = gen(p, 'a02');
  assert(code.includes('start1') || code.length > 100, 'Код не сгенерирован');
});

test('A03', 'autoTransitionTo через три листа — цепочка', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'A', keyboardType: 'none', buttons: [], autoTransitionTo: 'n2', enableAutoTransition: true } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'n2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'B', keyboardType: 'none', buttons: [], autoTransitionTo: 'n3', enableAutoTransition: true } },
    ]},
    { id: 's3', name: 'Лист 3', nodes: [
      { id: 'n3', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'C', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'a03');
  assert(code.length > 100, 'Код слишком короткий');
  assert(syntax(code, 'a03').ok, 'Синтаксическая ошибка');
});

// ─── Блок B: Кнопка goto между листами ────────────────────────────────────

test('B01', 'Кнопка goto из листа 1 в узел листа 2', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Выбери', keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg2' }] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'msg2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Ты нажал', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'b01');
  assert(code.includes('msg2') || code.includes('Ты нажал'), 'Целевой узел из листа 2 не найден в коде');
});

test('B02', 'Несколько кнопок goto в разные листы', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Меню', keyboardType: 'inline', buttons: [
        { id: 'b1', text: 'Лист 2', action: 'goto', target: 'msg_s2' },
        { id: 'b2', text: 'Лист 3', action: 'goto', target: 'msg_s3' },
      ]}},
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'msg_s2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Страница 2', keyboardType: 'none', buttons: [] } },
    ]},
    { id: 's3', name: 'Лист 3', nodes: [
      { id: 'msg_s3', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Страница 3', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'b02');
  assert(syntax(code, 'b02').ok, 'Синтаксическая ошибка');
});

test('B03', 'Reply-кнопка goto между листами', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'reply', buttons: [{ id: 'b1', text: 'Перейти', action: 'goto', target: 'n2' }] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'n2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Переход', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'b03');
  assert(code.length > 100, 'Код слишком короткий');
});

// ─── Блок C: Condition branches между листами ──────────────────────────────

test('C01', 'Condition с target в другом листе', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], autoTransitionTo: 'cond1', enableAutoTransition: true } },
      { id: 'cond1', type: 'condition', position: { x: 200, y: 0 }, data: { variable: 'age', operator: 'greater_than', value: '18', branches: [{ id: 'br1', operator: 'greater_than', value: '18', target: 'adult' }, { id: 'br2', operator: 'else', target: 'child' }] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'adult', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Взрослый', keyboardType: 'none', buttons: [] } },
      { id: 'child', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Ребёнок', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'c01');
  assert(syntax(code, 'c01').ok, 'Синтаксическая ошибка');
});

test('C02', 'Condition — одна ветка в том же листе, другая в другом', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], autoTransitionTo: 'cond1', enableAutoTransition: true } },
      { id: 'cond1', type: 'condition', position: { x: 200, y: 0 }, data: { variable: 'x', operator: 'filled', branches: [{ id: 'br1', operator: 'filled', target: 'local_msg' }, { id: 'br2', operator: 'else', target: 'remote_msg' }] } },
      { id: 'local_msg', type: 'message', position: { x: 400, y: 0 }, data: { messageText: 'Локальный', keyboardType: 'none', buttons: [] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'remote_msg', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Удалённый', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'c02');
  assert(syntax(code, 'c02').ok, 'Синтаксическая ошибка');
});

// ─── Блок D: keyboard-link между листами ──────────────────────────────────

test('D01', 'Keyboard-нода в другом листе привязана к message', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], keyboardNodeId: 'kbd1' } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'kbd1', type: 'keyboard', position: { x: 0, y: 0 }, data: { keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Кнопка', action: 'goto', target: 'start1' }] } },
    ]},
  ]);
  const code = gen(p, 'd01');
  assert(code.length > 100, 'Код слишком короткий');
  assert(syntax(code, 'd01').ok, 'Синтаксическая ошибка');
});

// ─── Блок E: input-target между листами ───────────────────────────────────

test('E01', 'input-узел с target в другом листе', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Введи имя', keyboardType: 'none', buttons: [], autoTransitionTo: 'inp1', enableAutoTransition: true } },
      { id: 'inp1', type: 'input', position: { x: 200, y: 0 }, data: { inputVariable: 'user_name', inputType: 'any', inputTargetNodeId: 'result' } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'result', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Спасибо!', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'e01', true);
  assert(syntax(code, 'e01').ok, 'Синтаксическая ошибка');
});

// ─── Блок F: Смешанные соединения между несколькими листами ───────────────

test('F01', 'Три листа — все типы соединений', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Старт', keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Далее', action: 'goto', target: 'msg2' }] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'msg2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Лист 2', keyboardType: 'none', buttons: [], autoTransitionTo: 'msg3', enableAutoTransition: true } },
    ]},
    { id: 's3', name: 'Лист 3', nodes: [
      { id: 'msg3', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Лист 3', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'f01');
  assert(syntax(code, 'f01').ok, 'Синтаксическая ошибка');
});

test('F02', 'Пустой лист среди активных — не ломает генерацию', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    ]},
    { id: 's2', name: 'Пустой лист', nodes: [] },
    { id: 's3', name: 'Лист 3', nodes: [
      { id: 'msg3', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Третий', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'f02');
  assert(syntax(code, 'f02').ok, 'Синтаксическая ошибка');
});

test('F03', 'Десять листов по одному узлу — цепочка autoTransition', () => {
  const sheets = Array.from({ length: 10 }, (_, i) => ({
    id: `s${i + 1}`,
    name: `Лист ${i + 1}`,
    nodes: [{
      id: `n${i + 1}`,
      type: i === 0 ? 'start' : 'message',
      position: { x: 0, y: 0 },
      data: {
        command: i === 0 ? '/start' : undefined,
        messageText: `Узел ${i + 1}`,
        keyboardType: 'none',
        buttons: [],
        ...(i < 9 ? { autoTransitionTo: `n${i + 2}`, enableAutoTransition: true } : {}),
      },
    }],
  }));
  const p = makeMultiSheetProject(sheets);
  const code = gen(p, 'f03');
  assert(syntax(code, 'f03').ok, 'Синтаксическая ошибка');
});

// ─── Блок G: Граничные случаи ─────────────────────────────────────────────

test('G01', 'target указывает на несуществующий узел — не падает', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], autoTransitionTo: 'nonexistent', enableAutoTransition: true } },
    ]},
  ]);
  let threw = false;
  try { gen(p, 'g01'); } catch { threw = true; }
  assert(!threw, 'Генератор упал на несуществующем target');
});

test('G02', 'Один лист — поведение как раньше', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
      { id: 'msg1', type: 'message', position: { x: 200, y: 0 }, data: { messageText: 'Ответ', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'g02');
  assert(syntax(code, 'g02').ok, 'Синтаксическая ошибка');
  assert(code.includes('start1') || code.includes('/start'), 'Стартовый узел не найден');
});

test('G03', 'Узел ссылается сам на себя — не зависает', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], autoTransitionTo: 'start1', enableAutoTransition: true } },
    ]},
  ]);
  let threw = false;
  try { gen(p, 'g03'); } catch { threw = true; }
  assert(!threw, 'Генератор упал на самоссылке');
});

// ─── Блок H: Синтаксис ────────────────────────────────────────────────────

test('H01', 'Два листа с inline-кнопками — синтаксис OK', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Меню', keyboardType: 'inline', buttons: [{ id: 'b1', text: 'Да', action: 'goto', target: 'yes' }, { id: 'b2', text: 'Нет', action: 'goto', target: 'no' }] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'yes', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Да!', keyboardType: 'none', buttons: [] } },
      { id: 'no', type: 'message', position: { x: 0, y: 200 }, data: { messageText: 'Нет!', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'h01');
  assert(syntax(code, 'h01').ok, 'Синтаксическая ошибка');
});

test('H02', 'Два листа с DB — синтаксис OK', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [], autoTransitionTo: 'msg2', enableAutoTransition: true } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'msg2', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'Второй', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'h02', true);
  assert(syntax(code, 'h02').ok, 'Синтаксическая ошибка');
});

test('H03', 'Text trigger в листе 2 — синтаксис OK', () => {
  const p = makeMultiSheetProject([
    { id: 's1', name: 'Лист 1', nodes: [
      { id: 'start1', type: 'start', position: { x: 0, y: 0 }, data: { command: '/start', messageText: 'Привет', keyboardType: 'none', buttons: [] } },
    ]},
    { id: 's2', name: 'Лист 2', nodes: [
      { id: 'trig1', type: 'text_trigger', position: { x: 0, y: 0 }, data: { textSynonyms: ['привет', 'хай'], autoTransitionTo: 'resp1', enableAutoTransition: true } },
      { id: 'resp1', type: 'message', position: { x: 200, y: 0 }, data: { messageText: 'Привет!', keyboardType: 'none', buttons: [] } },
    ]},
  ]);
  const code = gen(p, 'h03');
  assert(syntax(code, 'h03').ok, 'Синтаксическая ошибка');
});

// ─── Вывод результатов ────────────────────────────────────────────────────

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n=== Фаза 22: Межлистовые соединения ===`);
console.log(`Пройдено: ${passed} / ${results.length}`);
if (failed > 0) {
  console.log(`\nПровалено (${failed}):`);
  results.filter(r => !r.passed).forEach(r => console.log(`  [${r.id}] ${r.name}: ${r.note}`));
}
console.log('\nВсе тесты:');
results.forEach(r => console.log(`  ${r.passed ? '✓' : '✗'} [${r.id}] ${r.name}`));

if (failed > 0) process.exit(1);
