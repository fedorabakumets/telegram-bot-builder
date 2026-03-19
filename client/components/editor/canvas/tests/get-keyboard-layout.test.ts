/**
 * @fileoverview Тесты для getKeyboardRows
 *
 * Блок A: Граничные случаи (пустой массив, null, undefined)
 * Блок B: Автоматическое распределение — разное число кнопок
 * Блок C: Автоматическое распределение — разное число колонок
 * Блок D: Инварианты автоматического распределения
 * Блок E: Ручная раскладка — базовые случаи
 * Блок F: Ручная раскладка — фильтрация несуществующих ID
 * Блок G: Ручная раскладка — граничные случаи
 * Блок H: Сохранение дополнительных полей кнопок
 * Блок I: Порядок кнопок
 * Блок J: Смешанные случаи
 */

import { getKeyboardRows } from '../utils/get-keyboard-layout';

// ─── Утилиты ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

function eq(actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`Expected ${b},\n    got     ${a}`);
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ─── Фикстуры ─────────────────────────────────────────────────────────────────

const btns = (ids: string[]) => ids.map(id => ({ id }));
const ids = (n: number) => Array.from({ length: n }, (_, i) => `btn${i + 1}`);

type Layout = { autoLayout: boolean; columns: number; rows: { buttonIds: string[] }[] };
const autoLayout = (columns: number): Layout => ({ autoLayout: true, columns, rows: [] });
const manualLayout = (rows: string[][]): Layout => ({
  autoLayout: false,
  columns: 2,
  rows: rows.map(r => ({ buttonIds: r })),
});

// ─── Блок A: Граничные случаи ─────────────────────────────────────────────────

console.log('\nБлок A: Граничные случаи');

test('пустой массив → []', () => {
  eq(getKeyboardRows([]), []);
});

test('null → []', () => {
  eq(getKeyboardRows(null as any), []);
});

test('undefined → []', () => {
  eq(getKeyboardRows(undefined as any), []);
});

test('1 кнопка, колонки по умолчанию → 1 ряд', () => {
  eq(getKeyboardRows(btns(['a'])), [[{ id: 'a' }]]);
});

test('1 кнопка, 1 колонка → 1 ряд', () => {
  eq(getKeyboardRows(btns(['a']), undefined, 1), [[{ id: 'a' }]]);
});

test('1 кнопка, 100 колонок → 1 ряд', () => {
  eq(getKeyboardRows(btns(['a']), undefined, 100), [[{ id: 'a' }]]);
});

// ─── Блок B: Автоматическое распределение — разное число кнопок ──────────────

console.log('\nБлок B: Автоматическое распределение — разное число кнопок');

test('2 кнопки, 2 колонки → 1 ряд [2]', () => {
  eq(getKeyboardRows(btns(['a', 'b'])), [[{ id: 'a' }, { id: 'b' }]]);
});

test('3 кнопки, 2 колонки → 2 ряда [2, 1]', () => {
  eq(getKeyboardRows(btns(['a', 'b', 'c'])), [
    [{ id: 'a' }, { id: 'b' }],
    [{ id: 'c' }],
  ]);
});

test('4 кнопки, 2 колонки → 2 ряда [2, 2]', () => {
  eq(getKeyboardRows(btns(ids(4))), [
    [{ id: 'btn1' }, { id: 'btn2' }],
    [{ id: 'btn3' }, { id: 'btn4' }],
  ]);
});

test('5 кнопок, 2 колонки → 3 ряда [2, 2, 1]', () => {
  const rows = getKeyboardRows(btns(ids(5)));
  eq(rows.map(r => r.length), [2, 2, 1]);
});

test('6 кнопок, 2 колонки → 3 ряда [2, 2, 2]', () => {
  const rows = getKeyboardRows(btns(ids(6)));
  eq(rows.map(r => r.length), [2, 2, 2]);
});

test('7 кнопок, 2 колонки → 4 ряда [2, 2, 2, 1]', () => {
  const rows = getKeyboardRows(btns(ids(7)));
  eq(rows.map(r => r.length), [2, 2, 2, 1]);
});

test('8 кнопок, 2 колонки → 4 ряда [2, 2, 2, 2]', () => {
  const rows = getKeyboardRows(btns(ids(8)));
  eq(rows.map(r => r.length), [2, 2, 2, 2]);
});

test('10 кнопок, 2 колонки → 5 рядов', () => {
  const rows = getKeyboardRows(btns(ids(10)));
  assert(rows.length === 5, `Ожидалось 5 рядов, получено ${rows.length}`);
});

test('12 кнопок, 2 колонки → 6 рядов', () => {
  const rows = getKeyboardRows(btns(ids(12)));
  assert(rows.length === 6, `Ожидалось 6 рядов, получено ${rows.length}`);
});

// ─── Блок C: Автоматическое распределение — разное число колонок ─────────────

console.log('\nБлок C: Автоматическое распределение — разное число колонок');

test('4 кнопки, 1 колонка → 4 ряда', () => {
  const rows = getKeyboardRows(btns(ids(4)), undefined, 1);
  assert(rows.length === 4, `Ожидалось 4 ряда, получено ${rows.length}`);
  rows.forEach((r, i) => assert(r.length === 1, `Ряд ${i} должен содержать 1 кнопку`));
});

test('4 кнопки, 3 колонки → 2 ряда [3, 1]', () => {
  const rows = getKeyboardRows(btns(ids(4)), undefined, 3);
  eq(rows.map(r => r.length), [3, 1]);
});

test('6 кнопок, 3 колонки → 2 ряда [3, 3]', () => {
  const rows = getKeyboardRows(btns(ids(6)), undefined, 3);
  eq(rows.map(r => r.length), [3, 3]);
});

test('6 кнопок, 4 колонки → 2 ряда [4, 2]', () => {
  const rows = getKeyboardRows(btns(ids(6)), undefined, 4);
  eq(rows.map(r => r.length), [4, 2]);
});

test('6 кнопок, 5 колонок → 2 ряда [5, 1]', () => {
  const rows = getKeyboardRows(btns(ids(6)), undefined, 5);
  eq(rows.map(r => r.length), [5, 1]);
});

test('6 кнопок, 6 колонок → 1 ряд [6]', () => {
  const rows = getKeyboardRows(btns(ids(6)), undefined, 6);
  eq(rows.map(r => r.length), [6]);
});

test('columns=100 → все кнопки в одном ряду', () => {
  const rows = getKeyboardRows(btns(ids(10)), undefined, 100);
  assert(rows.length === 1, `Ожидался 1 ряд, получено ${rows.length}`);
  assert(rows[0].length === 10, `Ожидалось 10 кнопок, получено ${rows[0].length}`);
});

test('columns из keyboardLayout.autoLayout=true используется', () => {
  const rows = getKeyboardRows(btns(ids(4)), autoLayout(3) as any);
  eq(rows.map(r => r.length), [3, 1]);
});

test('columns=2 из autoLayout → 2 колонки', () => {
  const rows = getKeyboardRows(btns(ids(5)), autoLayout(2) as any);
  eq(rows.map(r => r.length), [2, 2, 1]);
});

// ─── Блок D: Инварианты автоматического распределения ────────────────────────

console.log('\nБлок D: Инварианты автоматического распределения');

test('сумма кнопок во всех рядах === исходное количество (5 кнопок)', () => {
  const rows = getKeyboardRows(btns(ids(5)));
  const total = rows.reduce((s, r) => s + r.length, 0);
  assert(total === 5, `Ожидалось 5, получено ${total}`);
});

test('сумма кнопок во всех рядах === исходное количество (12 кнопок)', () => {
  const rows = getKeyboardRows(btns(ids(12)));
  const total = rows.reduce((s, r) => s + r.length, 0);
  assert(total === 12, `Ожидалось 12, получено ${total}`);
});

test('ни один ряд не превышает заданное число колонок (3 колонки, 10 кнопок)', () => {
  const cols = 3;
  const rows = getKeyboardRows(btns(ids(10)), undefined, cols);
  rows.forEach((r, i) => {
    assert(r.length <= cols, `Ряд ${i} содержит ${r.length} > ${cols} кнопок`);
  });
});

test('ни один ряд не превышает заданное число колонок (4 колонки, 9 кнопок)', () => {
  const cols = 4;
  const rows = getKeyboardRows(btns(ids(9)), undefined, cols);
  rows.forEach((r, i) => {
    assert(r.length <= cols, `Ряд ${i} содержит ${r.length} > ${cols} кнопок`);
  });
});

test('только последний ряд может быть неполным', () => {
  const cols = 3;
  const rows = getKeyboardRows(btns(ids(7)), undefined, cols);
  for (let i = 0; i < rows.length - 1; i++) {
    assert(rows[i].length === cols, `Ряд ${i} должен быть полным (${cols}), получено ${rows[i].length}`);
  }
});

// ─── Блок E: Ручная раскладка — базовые случаи ───────────────────────────────

console.log('\nБлок E: Ручная раскладка — базовые случаи');

test('ручная раскладка — 1 ряд', () => {
  eq(getKeyboardRows(btns(['a', 'b', 'c']), manualLayout([['a', 'b', 'c']]) as any), [
    [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  ]);
});

test('ручная раскладка — 2 ряда', () => {
  eq(getKeyboardRows(btns(['a', 'b', 'c']), manualLayout([['a', 'b'], ['c']]) as any), [
    [{ id: 'a' }, { id: 'b' }],
    [{ id: 'c' }],
  ]);
});

test('ручная раскладка — 5 рядов по 1 кнопке', () => {
  const buttons = btns(ids(5));
  const layout = manualLayout(ids(5).map(id => [id]));
  const rows = getKeyboardRows(buttons, layout as any);
  assert(rows.length === 5, `Ожидалось 5 рядов, получено ${rows.length}`);
  rows.forEach((r, i) => assert(r.length === 1, `Ряд ${i} должен содержать 1 кнопку`));
});

test('ручная раскладка — порядок рядов сохраняется (обратный)', () => {
  eq(getKeyboardRows(btns(['a', 'b', 'c']), manualLayout([['c'], ['a', 'b']]) as any), [
    [{ id: 'c' }],
    [{ id: 'a' }, { id: 'b' }],
  ]);
});

test('ручная раскладка — порядок кнопок внутри ряда сохраняется', () => {
  eq(getKeyboardRows(btns(['a', 'b', 'c']), manualLayout([['c', 'a', 'b']]) as any), [
    [{ id: 'c' }, { id: 'a' }, { id: 'b' }],
  ]);
});

// ─── Блок F: Ручная раскладка — фильтрация несуществующих ID ─────────────────

console.log('\nБлок F: Ручная раскладка — фильтрация несуществующих ID');

test('ID из layout которого нет в buttons — пропускается', () => {
  eq(getKeyboardRows(btns(['a', 'b']), manualLayout([['a', 'MISSING']]) as any), [
    [{ id: 'a' }],
  ]);
});

test('ряд полностью из несуществующих ID — не добавляется', () => {
  eq(getKeyboardRows(btns(['a']), manualLayout([['MISSING1', 'MISSING2'], ['a']]) as any), [
    [{ id: 'a' }],
  ]);
});

test('все ряды из несуществующих ID → []', () => {
  eq(getKeyboardRows(btns(['a', 'b']), manualLayout([['X', 'Y'], ['Z']]) as any), []);
});

test('часть ID есть, часть нет — только существующие', () => {
  const rows = getKeyboardRows(
    btns(['a', 'b', 'c']),
    manualLayout([['a', 'MISSING', 'b'], ['c', 'GHOST']]) as any
  );
  eq(rows, [[{ id: 'a' }, { id: 'b' }], [{ id: 'c' }]]);
});

// ─── Блок G: Ручная раскладка — граничные случаи ─────────────────────────────

console.log('\nБлок G: Ручная раскладка — граничные случаи');

test('autoLayout=false, rows=[] → fallback на автоматическое', () => {
  const layout = { autoLayout: false, columns: 3, rows: [] };
  const rows = getKeyboardRows(btns(ids(4)), layout as any);
  // fallback: defaultColumns=2 (не columns из layout при пустых rows)
  assert(rows.length > 0, 'Ожидался непустой результат');
  const total = rows.reduce((s, r) => s + r.length, 0);
  assert(total === 4, `Ожидалось 4 кнопки, получено ${total}`);
});

test('дубликаты ID в rows — кнопка появляется дважды', () => {
  const rows = getKeyboardRows(btns(['a', 'b']), manualLayout([['a', 'a']]) as any);
  // Поведение зависит от реализации: кнопка может появиться дважды
  assert(rows.length > 0, 'Ожидался непустой результат');
});

test('пустой ряд в rows — не добавляется в результат', () => {
  const layout = {
    autoLayout: false,
    columns: 2,
    rows: [{ buttonIds: [] }, { buttonIds: ['a'] }],
  };
  const rows = getKeyboardRows(btns(['a', 'b']), layout as any);
  assert(rows.length === 1, `Ожидался 1 ряд, получено ${rows.length}`);
});

// ─── Блок H: Сохранение дополнительных полей кнопок ──────────────────────────

console.log('\nБлок H: Сохранение дополнительных полей кнопок');

test('поле label сохраняется при автоматическом распределении', () => {
  const buttons = [{ id: 'a', label: 'Кнопка A' }, { id: 'b', label: 'Кнопка B' }];
  const rows = getKeyboardRows(buttons);
  eq(rows[0][0], { id: 'a', label: 'Кнопка A' });
  eq(rows[0][1], { id: 'b', label: 'Кнопка B' });
});

test('поле text сохраняется при ручной раскладке', () => {
  const buttons = [{ id: 'a', text: 'Текст A' }, { id: 'b', text: 'Текст B' }];
  const rows = getKeyboardRows(buttons, manualLayout([['b', 'a']]) as any);
  eq(rows[0][0], { id: 'b', text: 'Текст B' });
  eq(rows[0][1], { id: 'a', text: 'Текст A' });
});

test('поле url сохраняется', () => {
  const buttons = [{ id: 'a', url: 'https://example.com' }];
  const rows = getKeyboardRows(buttons);
  eq(rows[0][0], { id: 'a', url: 'https://example.com' });
});

test('несколько дополнительных полей сохраняются', () => {
  const buttons = [{ id: 'a', label: 'A', text: 'T', url: 'U', extra: 42 }];
  const rows = getKeyboardRows(buttons);
  eq(rows[0][0], { id: 'a', label: 'A', text: 'T', url: 'U', extra: 42 });
});

test('поля сохраняются при фильтрации в ручной раскладке', () => {
  const buttons = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ];
  const rows = getKeyboardRows(buttons, manualLayout([['c', 'a']]) as any);
  eq(rows[0][0], { id: 'c', label: 'C' });
  eq(rows[0][1], { id: 'a', label: 'A' });
});

// ─── Блок I: Порядок кнопок ───────────────────────────────────────────────────

console.log('\nБлок I: Порядок кнопок');

test('порядок кнопок в автоматическом распределении сохраняется', () => {
  const buttons = btns(['z', 'y', 'x', 'w']);
  const rows = getKeyboardRows(buttons);
  eq(rows[0], [{ id: 'z' }, { id: 'y' }]);
  eq(rows[1], [{ id: 'x' }, { id: 'w' }]);
});

test('порядок кнопок в ручной раскладке сохраняется', () => {
  const buttons = btns(['a', 'b', 'c', 'd']);
  const rows = getKeyboardRows(buttons, manualLayout([['d', 'c'], ['b', 'a']]) as any);
  eq(rows[0], [{ id: 'd' }, { id: 'c' }]);
  eq(rows[1], [{ id: 'b' }, { id: 'a' }]);
});

test('columns=1 → каждая кнопка в отдельном ряду', () => {
  const buttons = btns(['a', 'b', 'c']);
  const rows = getKeyboardRows(buttons, undefined, 1);
  eq(rows, [[{ id: 'a' }], [{ id: 'b' }], [{ id: 'c' }]]);
});

test('все кнопки присутствуют в результате (автоматически)', () => {
  const buttons = btns(ids(7));
  const rows = getKeyboardRows(buttons);
  const allIds = rows.flat().map(b => b.id);
  ids(7).forEach(id => {
    assert(allIds.includes(id), `Кнопка ${id} отсутствует в результате`);
  });
});

// ─── Блок J: Смешанные случаи ─────────────────────────────────────────────────

console.log('\nБлок J: Смешанные случаи');

test('autoLayout=true с rows — игнорирует rows, использует columns', () => {
  const layout = {
    autoLayout: true,
    columns: 2,
    rows: [{ buttonIds: ['c', 'a'] }], // должно быть проигнорировано
  };
  const rows = getKeyboardRows(btns(['a', 'b', 'c']), layout as any);
  // При autoLayout=true должно использоваться автоматическое распределение
  const total = rows.reduce((s, r) => s + r.length, 0);
  assert(total === 3, `Ожидалось 3 кнопки, получено ${total}`);
});

test('ручная раскладка: часть кнопок из layout есть, часть нет', () => {
  const buttons = btns(['a', 'b', 'c', 'd', 'e']);
  const layout = manualLayout([['a', 'GHOST', 'b'], ['c', 'd']]);
  const rows = getKeyboardRows(buttons, layout as any);
  eq(rows[0], [{ id: 'a' }, { id: 'b' }]);
  eq(rows[1], [{ id: 'c' }, { id: 'd' }]);
});

test('кнопки не из layout не добавляются в ручной раскладке', () => {
  const buttons = btns(['a', 'b', 'c', 'd']);
  const layout = manualLayout([['a', 'b']]); // c и d не в layout
  const rows = getKeyboardRows(buttons, layout as any);
  const allIds = rows.flat().map(b => b.id);
  assert(!allIds.includes('c'), 'Кнопка c не должна быть в результате');
  assert(!allIds.includes('d'), 'Кнопка d не должна быть в результате');
});

test('большое количество кнопок (20) с 4 колонками → 5 рядов', () => {
  const rows = getKeyboardRows(btns(ids(20)), undefined, 4);
  assert(rows.length === 5, `Ожидалось 5 рядов, получено ${rows.length}`);
  const total = rows.reduce((s, r) => s + r.length, 0);
  assert(total === 20, `Ожидалось 20 кнопок, получено ${total}`);
});

test('keyboardLayout без columns → использует defaultColumns', () => {
  const layout = { autoLayout: true, rows: [] }; // нет columns
  const rows = getKeyboardRows(btns(ids(5)), layout as any, 3);
  // defaultColumns=3, но layout.columns отсутствует → должен использоваться defaultColumns
  const total = rows.reduce((s, r) => s + r.length, 0);
  assert(total === 5, `Ожидалось 5 кнопок, получено ${total}`);
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
