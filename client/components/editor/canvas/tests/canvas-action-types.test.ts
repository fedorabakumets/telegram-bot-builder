/**
 * Тесты для типа Action и логики addAction из canvas/canvas.tsx
 * Запуск: npx tsx client/components/editor/canvas/tests/canvas-action-types.test.ts
 */
export {};

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

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Копия из canvas.tsx
type ActionType = 'add' | 'delete' | 'move' | 'move_end' | 'update' | 'connect' | 'disconnect' | 'duplicate' | 'reset' | 'type_change' | 'id_change' | 'button_add' | 'button_update' | 'button_delete' | 'sheet_add' | 'sheet_delete' | 'sheet_rename' | 'sheet_duplicate' | 'sheet_switch';

const ALL_ACTION_TYPES: ActionType[] = [
  'add', 'delete', 'move', 'move_end', 'update', 'connect', 'disconnect',
  'duplicate', 'reset', 'type_change', 'id_change', 'button_add', 'button_update',
  'button_delete', 'sheet_add', 'sheet_delete', 'sheet_rename', 'sheet_duplicate', 'sheet_switch'
];

// Воссоздание логики createAction (аналог addAction из canvas.tsx)
function createAction(type: ActionType, description: string): { id: string; type: ActionType; description: string; timestamp: number } {
  return {
    id: Math.random().toString(36).substring(2),
    type,
    description,
    timestamp: Date.now()
  };
}

// Группы типов
const NODE_OPS: ActionType[] = ['add', 'delete', 'move', 'move_end', 'update', 'duplicate', 'reset'];
const CONNECTION_OPS: ActionType[] = ['connect', 'disconnect'];
const BUTTON_OPS: ActionType[] = ['button_add', 'button_update', 'button_delete'];
const SHEET_OPS: ActionType[] = ['sheet_add', 'sheet_delete', 'sheet_rename', 'sheet_duplicate', 'sheet_switch'];
const CHANGE_OPS: ActionType[] = ['type_change', 'id_change'];

// ─── Блок A: ALL_ACTION_TYPES содержит ровно 19 типов ────────────────────────
console.log('\nБлок A: ALL_ACTION_TYPES содержит ровно 19 типов');

test('A1: длина ALL_ACTION_TYPES === 19', () => assert(ALL_ACTION_TYPES.length === 19, `Ожидалось 19, получено ${ALL_ACTION_TYPES.length}`));
test('A2: ALL_ACTION_TYPES — массив', () => assert(Array.isArray(ALL_ACTION_TYPES), 'Ожидался массив'));
test('A3: ALL_ACTION_TYPES не пустой', () => assert(ALL_ACTION_TYPES.length > 0, 'Массив пустой'));
test('A4: первый элемент — "add"', () => assert(ALL_ACTION_TYPES[0] === 'add', `Ожидался "add", получено "${ALL_ACTION_TYPES[0]}"`));
test('A5: последний элемент — "sheet_switch"', () => assert(ALL_ACTION_TYPES[ALL_ACTION_TYPES.length - 1] === 'sheet_switch', `Ожидался "sheet_switch", получено "${ALL_ACTION_TYPES[ALL_ACTION_TYPES.length - 1]}"`));
test('A6: содержит "add"', () => assert(ALL_ACTION_TYPES.includes('add'), '"add" отсутствует'));
test('A7: содержит "sheet_switch"', () => assert(ALL_ACTION_TYPES.includes('sheet_switch'), '"sheet_switch" отсутствует'));
test('A8: содержит "type_change"', () => assert(ALL_ACTION_TYPES.includes('type_change'), '"type_change" отсутствует'));

// ─── Блок B: Каждый тип — непустая строка без пробелов ───────────────────────
console.log('\nБлок B: Каждый тип — непустая строка без пробелов');

for (const type of ALL_ACTION_TYPES) {
  test(`B: "${type}" — строка без пробелов`, () => {
    assert(typeof type === 'string', `${type} не строка`);
    assert(type.length > 0, `${type} пустой`);
    assert(!type.includes(' '), `${type} содержит пробел`);
  });
}

// ─── Блок C: Нет дублирующихся типов ─────────────────────────────────────────
console.log('\nБлок C: Нет дублирующихся типов в ALL_ACTION_TYPES');

test('C1: все типы уникальны', () => {
  const unique = new Set(ALL_ACTION_TYPES);
  assert(unique.size === ALL_ACTION_TYPES.length, `Дублирующиеся типы: ${ALL_ACTION_TYPES.filter((v, i) => ALL_ACTION_TYPES.indexOf(v) !== i)}`);
});
test('C2: "add" встречается ровно 1 раз', () => {
  const count = ALL_ACTION_TYPES.filter(t => t === 'add').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('C3: "delete" встречается ровно 1 раз', () => {
  const count = ALL_ACTION_TYPES.filter(t => t === 'delete').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('C4: "sheet_add" встречается ровно 1 раз', () => {
  const count = ALL_ACTION_TYPES.filter(t => t === 'sheet_add').length;
  assert(count === 1, `Ожидалось 1, получено ${count}`);
});
test('C5: Set(ALL_ACTION_TYPES).size === 19', () => {
  assert(new Set(ALL_ACTION_TYPES).size === 19, `Ожидалось 19 уникальных, получено ${new Set(ALL_ACTION_TYPES).size}`);
});

// ─── Блок D: createAction создаёт объект с правильными полями ────────────────
console.log('\nБлок D: createAction создаёт объект с правильными полями (id, type, description, timestamp)');

test('D1: createAction возвращает объект', () => {
  const action = createAction('add', 'Добавлен узел');
  assert(typeof action === 'object' && action !== null, 'Ожидался объект');
});
test('D2: объект содержит поле id', () => assert('id' in createAction('add', 'test'), 'Поле id отсутствует'));
test('D3: объект содержит поле type', () => assert('type' in createAction('add', 'test'), 'Поле type отсутствует'));
test('D4: объект содержит поле description', () => assert('description' in createAction('add', 'test'), 'Поле description отсутствует'));
test('D5: объект содержит поле timestamp', () => assert('timestamp' in createAction('add', 'test'), 'Поле timestamp отсутствует'));
test('D6: объект содержит ровно 4 поля', () => {
  const action = createAction('add', 'test');
  assert(Object.keys(action).length === 4, `Ожидалось 4 поля, получено ${Object.keys(action).length}`);
});
test('D7: id — строка', () => assert(typeof createAction('add', 'test').id === 'string', 'id не строка'));
test('D8: timestamp — число', () => assert(typeof createAction('add', 'test').timestamp === 'number', 'timestamp не число'));

// ─── Блок E: timestamp близок к Date.now() ───────────────────────────────────
console.log('\nБлок E: createAction — timestamp близок к Date.now() (±1 сек)');

test('E1: timestamp ≤ Date.now()', () => {
  const action = createAction('add', 'test');
  const after = Date.now();
  assert(action.timestamp <= after, `timestamp ${action.timestamp} > Date.now() ${after}`);
});
test('E2: timestamp ≥ Date.now() - 1000', () => {
  const action = createAction('add', 'test');
  assert(action.timestamp >= Date.now() - 1000, `timestamp слишком старый: ${action.timestamp}`);
});
test('E3: timestamp — положительное число', () => assert(createAction('add', 'test').timestamp > 0, 'timestamp не положительный'));
test('E4: timestamp — целое число (миллисекунды)', () => {
  const ts = createAction('add', 'test').timestamp;
  assert(Number.isInteger(ts), `timestamp ${ts} не целое`);
});
test('E5: два вызова подряд — timestamp второго ≥ первого', () => {
  const a1 = createAction('add', 'test1');
  const a2 = createAction('delete', 'test2');
  assert(a2.timestamp >= a1.timestamp, `timestamp второго (${a2.timestamp}) < первого (${a1.timestamp})`);
});
test('E6: timestamp > 1_000_000_000_000 (после 2001 года)', () => {
  assert(createAction('add', 'test').timestamp > 1_000_000_000_000, 'timestamp слишком маленький');
});

// ─── Блок F: id непустой и уникальный (50 вызовов) ───────────────────────────
console.log('\nБлок F: createAction — id непустой и уникальный (50 вызовов)');

test('F1: id непустой', () => assert(createAction('add', 'test').id.length > 0, 'id пустой'));
test('F2: 50 вызовов — все id уникальны', () => {
  const ids = Array.from({ length: 50 }, () => createAction('add', 'test').id);
  const unique = new Set(ids);
  assert(unique.size === 50, `Дублирующиеся id: ${50 - unique.size} дублей из 50`);
});
test('F3: id — строка', () => assert(typeof createAction('add', 'test').id === 'string', 'id не строка'));
test('F4: id длиннее 0 символов', () => assert(createAction('add', 'test').id.length > 0, 'id пустой'));
test('F5: 10 вызовов — все id разные', () => {
  const ids = Array.from({ length: 10 }, () => createAction('move', 'test').id);
  assert(new Set(ids).size === 10, 'Есть дублирующиеся id');
});

// ─── Блок G: type сохраняется точно ──────────────────────────────────────────
console.log('\nБлок G: createAction — type сохраняется точно');

for (const type of ALL_ACTION_TYPES) {
  test(`G: createAction("${type}", ...) → type === "${type}"`, () => {
    const action = createAction(type, 'test');
    assert(action.type === type, `Ожидался type "${type}", получено "${action.type}"`);
  });
}

// ─── Блок H: description сохраняется точно ───────────────────────────────────
console.log('\nБлок H: createAction — description сохраняется точно');

test('H1: description "Добавлен узел" сохраняется', () => assert(createAction('add', 'Добавлен узел').description === 'Добавлен узел', 'description не совпадает'));
test('H2: description "Удалён узел" сохраняется', () => assert(createAction('delete', 'Удалён узел').description === 'Удалён узел', 'description не совпадает'));
test('H3: пустая description сохраняется', () => assert(createAction('add', '').description === '', 'description не совпадает'));
test('H4: description с пробелами сохраняется', () => assert(createAction('add', '  test  ').description === '  test  ', 'description не совпадает'));
test('H5: description с кириллицей сохраняется', () => assert(createAction('update', 'Обновлён узел "message"').description === 'Обновлён узел "message"', 'description не совпадает'));

// ─── Блок I: Группы — node-операции ──────────────────────────────────────────
console.log('\nБлок I: Группы типов — node-операции');

test('I1: NODE_OPS содержит 7 типов', () => assert(NODE_OPS.length === 7, `Ожидалось 7, получено ${NODE_OPS.length}`));
test('I2: NODE_OPS содержит "add"', () => assert(NODE_OPS.includes('add'), '"add" отсутствует'));
test('I3: NODE_OPS содержит "delete"', () => assert(NODE_OPS.includes('delete'), '"delete" отсутствует'));
test('I4: NODE_OPS содержит "move"', () => assert(NODE_OPS.includes('move'), '"move" отсутствует'));
test('I5: NODE_OPS содержит "move_end"', () => assert(NODE_OPS.includes('move_end'), '"move_end" отсутствует'));
test('I6: NODE_OPS содержит "update"', () => assert(NODE_OPS.includes('update'), '"update" отсутствует'));
test('I7: NODE_OPS содержит "duplicate"', () => assert(NODE_OPS.includes('duplicate'), '"duplicate" отсутствует'));
test('I8: NODE_OPS содержит "reset"', () => assert(NODE_OPS.includes('reset'), '"reset" отсутствует'));

// ─── Блок J: Группы — connection-операции ────────────────────────────────────
console.log('\nБлок J: Группы типов — connection-операции');

test('J1: CONNECTION_OPS содержит 2 типа', () => assert(CONNECTION_OPS.length === 2, `Ожидалось 2, получено ${CONNECTION_OPS.length}`));
test('J2: CONNECTION_OPS содержит "connect"', () => assert(CONNECTION_OPS.includes('connect'), '"connect" отсутствует'));
test('J3: CONNECTION_OPS содержит "disconnect"', () => assert(CONNECTION_OPS.includes('disconnect'), '"disconnect" отсутствует'));
test('J4: CONNECTION_OPS не содержит "add"', () => assert(!CONNECTION_OPS.includes('add'), '"add" не должен быть в CONNECTION_OPS'));

// ─── Блок K: Группы — button-операции ────────────────────────────────────────
console.log('\nБлок K: Группы типов — button-операции');

test('K1: BUTTON_OPS содержит 3 типа', () => assert(BUTTON_OPS.length === 3, `Ожидалось 3, получено ${BUTTON_OPS.length}`));
test('K2: BUTTON_OPS содержит "button_add"', () => assert(BUTTON_OPS.includes('button_add'), '"button_add" отсутствует'));
test('K3: BUTTON_OPS содержит "button_update"', () => assert(BUTTON_OPS.includes('button_update'), '"button_update" отсутствует'));
test('K4: BUTTON_OPS содержит "button_delete"', () => assert(BUTTON_OPS.includes('button_delete'), '"button_delete" отсутствует'));
test('K5: все BUTTON_OPS начинаются с "button_"', () => {
  for (const op of BUTTON_OPS) {
    assert(op.startsWith('button_'), `"${op}" не начинается с "button_"`);
  }
});

// ─── Блок L: Группы — sheet-операции ─────────────────────────────────────────
console.log('\nБлок L: Группы типов — sheet-операции');

test('L1: SHEET_OPS содержит 5 типов', () => assert(SHEET_OPS.length === 5, `Ожидалось 5, получено ${SHEET_OPS.length}`));
test('L2: SHEET_OPS содержит "sheet_add"', () => assert(SHEET_OPS.includes('sheet_add'), '"sheet_add" отсутствует'));
test('L3: SHEET_OPS содержит "sheet_delete"', () => assert(SHEET_OPS.includes('sheet_delete'), '"sheet_delete" отсутствует'));
test('L4: SHEET_OPS содержит "sheet_rename"', () => assert(SHEET_OPS.includes('sheet_rename'), '"sheet_rename" отсутствует'));
test('L5: SHEET_OPS содержит "sheet_duplicate"', () => assert(SHEET_OPS.includes('sheet_duplicate'), '"sheet_duplicate" отсутствует'));
test('L6: SHEET_OPS содержит "sheet_switch"', () => assert(SHEET_OPS.includes('sheet_switch'), '"sheet_switch" отсутствует'));
test('L7: все SHEET_OPS начинаются с "sheet_"', () => {
  for (const op of SHEET_OPS) {
    assert(op.startsWith('sheet_'), `"${op}" не начинается с "sheet_"`);
  }
});

// ─── Блок M: Группы — change-операции ────────────────────────────────────────
console.log('\nБлок M: Группы типов — change-операции');

test('M1: CHANGE_OPS содержит 2 типа', () => assert(CHANGE_OPS.length === 2, `Ожидалось 2, получено ${CHANGE_OPS.length}`));
test('M2: CHANGE_OPS содержит "type_change"', () => assert(CHANGE_OPS.includes('type_change'), '"type_change" отсутствует'));
test('M3: CHANGE_OPS содержит "id_change"', () => assert(CHANGE_OPS.includes('id_change'), '"id_change" отсутствует'));
test('M4: все CHANGE_OPS заканчиваются на "_change"', () => {
  for (const op of CHANGE_OPS) {
    assert(op.endsWith('_change'), `"${op}" не заканчивается на "_change"`);
  }
});

// ─── Блок N: Все типы покрыты группами ───────────────────────────────────────
console.log('\nБлок N: Все типы покрыты группами (сумма всех групп === ALL_ACTION_TYPES.length)');

test('N1: сумма всех групп === 19', () => {
  const total = NODE_OPS.length + CONNECTION_OPS.length + BUTTON_OPS.length + SHEET_OPS.length + CHANGE_OPS.length;
  assert(total === 19, `Ожидалось 19, получено ${total}`);
});
test('N2: сумма всех групп === ALL_ACTION_TYPES.length', () => {
  const total = NODE_OPS.length + CONNECTION_OPS.length + BUTTON_OPS.length + SHEET_OPS.length + CHANGE_OPS.length;
  assert(total === ALL_ACTION_TYPES.length, `Ожидалось ${ALL_ACTION_TYPES.length}, получено ${total}`);
});
test('N3: каждый тип из ALL_ACTION_TYPES входит в одну из групп', () => {
  const allGrouped = [...NODE_OPS, ...CONNECTION_OPS, ...BUTTON_OPS, ...SHEET_OPS, ...CHANGE_OPS];
  for (const type of ALL_ACTION_TYPES) {
    assert(allGrouped.includes(type), `Тип "${type}" не входит ни в одну группу`);
  }
});
test('N4: нет типов, входящих в несколько групп', () => {
  const allGrouped = [...NODE_OPS, ...CONNECTION_OPS, ...BUTTON_OPS, ...SHEET_OPS, ...CHANGE_OPS];
  const unique = new Set(allGrouped);
  assert(unique.size === allGrouped.length, `Есть типы в нескольких группах: ${allGrouped.filter((v, i) => allGrouped.indexOf(v) !== i)}`);
});
test('N5: NODE_OPS + CONNECTION_OPS = 9 типов', () => {
  assert(NODE_OPS.length + CONNECTION_OPS.length === 9, `Ожидалось 9, получено ${NODE_OPS.length + CONNECTION_OPS.length}`);
});
test('N6: BUTTON_OPS + SHEET_OPS + CHANGE_OPS = 10 типов', () => {
  const total = BUTTON_OPS.length + SHEET_OPS.length + CHANGE_OPS.length;
  assert(total === 10, `Ожидалось 10, получено ${total}`);
});

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
