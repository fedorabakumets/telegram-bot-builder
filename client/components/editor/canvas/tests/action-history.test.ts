/**
 * Тесты для логики action-history: addAction, toggleActionSelection, selectRange, handleUndoSelected, getActionIcon
 * Запуск: npx tsx client/components/editor/canvas/tests/action-history.test.ts
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

// ─── Копия логики из canvas ───────────────────────────────────────────────────

type ActionType = 'add' | 'delete' | 'move' | 'move_end' | 'update' | 'connect' | 'disconnect' | 'duplicate' | 'reset' | 'type_change' | 'id_change' | 'button_add' | 'button_update' | 'button_delete' | 'sheet_add' | 'sheet_delete' | 'sheet_rename' | 'sheet_duplicate' | 'sheet_switch';

interface Action {
  id: string;
  type: ActionType;
  description: string;
  timestamp: number;
}

const MAX_HISTORY = 50;

function addAction(history: Action[], type: ActionType, description: string): Action[] {
  const newAction: Action = {
    id: Math.random().toString(36).substring(2),
    type,
    description,
    timestamp: Date.now()
  };
  return [newAction, ...history].slice(0, MAX_HISTORY);
}

function toggleActionSelection(selected: Set<string>, actionId: string): Set<string> {
  const newSet = new Set(selected);
  if (newSet.has(actionId)) {
    newSet.delete(actionId);
  } else {
    newSet.add(actionId);
  }
  return newSet;
}

function selectRange(history: Action[], startIndex: number, endIndex: number): Set<string> {
  const [min, max] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  const newSet = new Set<string>();
  for (let i = min; i <= max; i++) {
    if (history[i]) {
      newSet.add(history[i].id);
    }
  }
  return newSet;
}

function handleUndoSelected(
  selected: Set<string>,
  onUndo: (() => void) | undefined
): { callCount: number; newSelected: Set<string> } {
  if (selected.size === 0 || !onUndo) {
    return { callCount: 0, newSelected: selected };
  }
  let callCount = 0;
  for (let i = 0; i < selected.size; i++) {
    onUndo();
    callCount++;
  }
  return { callCount, newSelected: new Set() };
}

function getActionIcon(type: ActionType): { icon: string; colorClass: string } {
  switch (type) {
    case 'add': return { icon: 'plus', colorClass: 'text-green-600 dark:text-green-400' };
    case 'delete': return { icon: 'trash', colorClass: 'text-red-600 dark:text-red-400' };
    case 'move': return { icon: 'arrows', colorClass: 'text-blue-600 dark:text-blue-400' };
    case 'update': return { icon: 'edit', colorClass: 'text-purple-600 dark:text-purple-400' };
    case 'connect': return { icon: 'link', colorClass: 'text-cyan-600 dark:text-cyan-400' };
    case 'disconnect': return { icon: 'unlink', colorClass: 'text-orange-600 dark:text-orange-400' };
    case 'duplicate': return { icon: 'copy', colorClass: 'text-yellow-600 dark:text-yellow-400' };
    default: return { icon: 'circle', colorClass: 'text-gray-600 dark:text-gray-400' };
  }
}

// ─── Блок A: addAction — структура нового действия ───────────────────────────
console.log('\nБлок A: addAction — структура нового действия');

test('A1: возвращает массив', () => {
  const result = addAction([], 'add', 'test');
  assert(Array.isArray(result), 'Ожидался массив');
});
test('A2: новое действие в начале (index 0)', () => {
  const result = addAction([], 'add', 'test');
  assert(result.length > 0 && result[0].type === 'add', 'Новое действие не на index 0');
});
test('A3: id — непустая строка', () => {
  const result = addAction([], 'add', 'test');
  assert(typeof result[0].id === 'string' && result[0].id.length > 0, 'id пустой или не строка');
});
test('A4: type сохраняется точно', () => {
  const result = addAction([], 'delete', 'test');
  assert(result[0].type === 'delete', `Ожидался "delete", получено "${result[0].type}"`);
});
test('A5: description сохраняется точно', () => {
  const result = addAction([], 'add', 'Добавлен узел');
  assert(result[0].description === 'Добавлен узел', 'description не совпадает');
});
test('A6: timestamp — число, близкое к Date.now()', () => {
  const before = Date.now();
  const result = addAction([], 'add', 'test');
  const after = Date.now();
  assert(result[0].timestamp >= before && result[0].timestamp <= after, 'timestamp вне диапазона');
});
test('A7: timestamp > 0', () => {
  const result = addAction([], 'add', 'test');
  assert(result[0].timestamp > 0, 'timestamp не положительный');
});
test('A8: предыдущие действия сдвигаются вправо', () => {
  const first = addAction([], 'add', 'first');
  const second = addAction(first, 'delete', 'second');
  assert(second[1].description === 'first', 'Предыдущее действие не на index 1');
});
test('A9: история из 1 элемента → после addAction длина 2', () => {
  const h1 = addAction([], 'add', 'a');
  const h2 = addAction(h1, 'delete', 'b');
  assert(h2.length === 2, `Ожидалось 2, получено ${h2.length}`);
});
test('A10: пустая история → после addAction длина 1', () => {
  const result = addAction([], 'add', 'test');
  assert(result.length === 1, `Ожидалось 1, получено ${result.length}`);
});

// ─── Блок B: addAction — лимит 50 записей ────────────────────────────────────
console.log('\nБлок B: addAction — лимит 50 записей');

test('B1: история из 49 → после addAction длина 50', () => {
  let h: Action[] = [];
  for (let i = 0; i < 49; i++) h = addAction(h, 'add', `a${i}`);
  h = addAction(h, 'delete', 'last');
  assert(h.length === 50, `Ожидалось 50, получено ${h.length}`);
});
test('B2: история из 50 → после addAction длина 50 (не растёт)', () => {
  let h: Action[] = [];
  for (let i = 0; i < 50; i++) h = addAction(h, 'add', `a${i}`);
  h = addAction(h, 'delete', 'overflow');
  assert(h.length === 50, `Ожидалось 50, получено ${h.length}`);
});
test('B3: история из 51 (если передать) → обрезается до 50', () => {
  const big: Action[] = Array.from({ length: 51 }, (_, i) => ({
    id: `id${i}`, type: 'add' as ActionType, description: `d${i}`, timestamp: Date.now()
  }));
  const result = addAction(big, 'delete', 'new');
  assert(result.length === 50, `Ожидалось 50, получено ${result.length}`);
});
test('B4: самое старое действие вытесняется при переполнении', () => {
  let h: Action[] = [];
  for (let i = 0; i < 50; i++) h = addAction(h, 'add', `item${i}`);
  const oldestId = h[h.length - 1].id;
  h = addAction(h, 'delete', 'new');
  assert(!h.some(a => a.id === oldestId), 'Старое действие не было вытеснено');
});
test('B5: после 100 addAction подряд — длина ровно 50', () => {
  let h: Action[] = [];
  for (let i = 0; i < 100; i++) h = addAction(h, 'add', `a${i}`);
  assert(h.length === 50, `Ожидалось 50, получено ${h.length}`);
});
test('B6: новое действие всегда в начале даже при переполнении', () => {
  let h: Action[] = [];
  for (let i = 0; i < 50; i++) h = addAction(h, 'add', `a${i}`);
  h = addAction(h, 'delete', 'newest');
  assert(h[0].description === 'newest', 'Новое действие не в начале');
});
test('B7: лимит MAX_HISTORY === 50', () => {
  assert(MAX_HISTORY === 50, `Ожидалось 50, получено ${MAX_HISTORY}`);
});
test('B8: slice(0, 50) — первые 50 элементов сохраняются', () => {
  let h: Action[] = [];
  for (let i = 0; i < 50; i++) h = addAction(h, 'add', `a${i}`);
  const first50Ids = h.map(a => a.id);
  h = addAction(h, 'delete', 'new');
  const remaining = h.slice(1).map(a => a.id);
  assert(remaining.every(id => first50Ids.includes(id)), 'Первые 50 элементов не сохранились');
});

// ─── Блок C: addAction — порядок (новые в начало) ────────────────────────────
console.log('\nБлок C: addAction — порядок (новые в начало)');

test('C1: первое добавленное действие — в конце истории', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'first');
  h = addAction(h, 'delete', 'second');
  h = addAction(h, 'move', 'third');
  assert(h[h.length - 1].description === 'first', 'Первое добавленное не в конце');
});
test('C2: последнее добавленное — в начале', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'first');
  h = addAction(h, 'delete', 'last');
  assert(h[0].description === 'last', 'Последнее добавленное не в начале');
});
test('C3: 5 действий подряд — порядок обратный добавлению', () => {
  let h: Action[] = [];
  const labels = ['a', 'b', 'c', 'd', 'e'];
  for (const l of labels) h = addAction(h, 'add', l);
  const order = h.map(a => a.description);
  assert(JSON.stringify(order) === JSON.stringify([...labels].reverse()), `Порядок неверный: ${order}`);
});
test('C4: history[0].type === тип последнего добавленного', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'a');
  h = addAction(h, 'delete', 'b');
  assert(h[0].type === 'delete', `Ожидался "delete", получено "${h[0].type}"`);
});
test('C5: history[history.length-1].type === тип первого добавленного', () => {
  let h: Action[] = [];
  h = addAction(h, 'connect', 'a');
  h = addAction(h, 'delete', 'b');
  assert(h[h.length - 1].type === 'connect', `Ожидался "connect", получено "${h[h.length - 1].type}"`);
});
test('C6: два действия — первое добавленное на index 1', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'first');
  h = addAction(h, 'delete', 'second');
  assert(h[1].description === 'first', 'Первое добавленное не на index 1');
});
test('C7: три действия — порядок [c, b, a] если добавляли a, b, c', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'a');
  h = addAction(h, 'delete', 'b');
  h = addAction(h, 'move', 'c');
  assert(h[0].description === 'c' && h[1].description === 'b' && h[2].description === 'a',
    `Порядок неверный: ${h.map(a => a.description)}`);
});
test('C8: id каждого действия уникален', () => {
  let h: Action[] = [];
  for (let i = 0; i < 10; i++) h = addAction(h, 'add', `a${i}`);
  const ids = h.map(a => a.id);
  assert(new Set(ids).size === ids.length, 'Есть дублирующиеся id');
});

// ─── Блок D: toggleActionSelection — переключение ────────────────────────────
console.log('\nБлок D: toggleActionSelection — переключение');

test('D1: пустой Set + новый id → Set с 1 элементом', () => {
  const result = toggleActionSelection(new Set(), 'abc');
  assert(result.size === 1, `Ожидался размер 1, получено ${result.size}`);
});
test('D2: Set с id + тот же id → пустой Set (удаление)', () => {
  const result = toggleActionSelection(new Set(['abc']), 'abc');
  assert(result.size === 0, `Ожидался размер 0, получено ${result.size}`);
});
test('D3: Set с id + другой id → Set с 2 элементами', () => {
  const result = toggleActionSelection(new Set(['abc']), 'xyz');
  assert(result.size === 2, `Ожидался размер 2, получено ${result.size}`);
});
test('D4: не мутирует исходный Set', () => {
  const original = new Set(['abc']);
  toggleActionSelection(original, 'xyz');
  assert(original.size === 1, 'Исходный Set был мутирован');
});
test('D5: возвращает новый Set', () => {
  const original = new Set(['abc']);
  const result = toggleActionSelection(original, 'xyz');
  assert(result !== original, 'Возвращён тот же Set');
});
test('D6: toggle дважды → возвращает к исходному состоянию', () => {
  const original = new Set(['abc']);
  const after1 = toggleActionSelection(original, 'xyz');
  const after2 = toggleActionSelection(after1, 'xyz');
  assert(after2.size === 1 && after2.has('abc') && !after2.has('xyz'), 'Состояние не восстановлено');
});
test('D7: Set с 3 элементами, удаляем один → 2 элемента', () => {
  const s = new Set(['a', 'b', 'c']);
  const result = toggleActionSelection(s, 'b');
  assert(result.size === 2, `Ожидался размер 2, получено ${result.size}`);
});
test('D8: Set с 3 элементами, добавляем новый → 4 элемента', () => {
  const s = new Set(['a', 'b', 'c']);
  const result = toggleActionSelection(s, 'd');
  assert(result.size === 4, `Ожидался размер 4, получено ${result.size}`);
});
test('D9: id сохраняется точно (строка)', () => {
  const result = toggleActionSelection(new Set(), 'my-id-123');
  assert(result.has('my-id-123'), 'id не сохранился точно');
});
test('D10: пустой id — работает корректно', () => {
  const result = toggleActionSelection(new Set(), '');
  assert(result.size === 1 && result.has(''), 'Пустой id не добавлен');
});

// ─── Блок E: selectRange — выбор диапазона ───────────────────────────────────
console.log('\nБлок E: selectRange — выбор диапазона');

function makeHistory(n: number): Action[] {
  let h: Action[] = [];
  for (let i = 0; i < n; i++) h = addAction(h, 'add', `item${i}`);
  return h;
}

const sampleHistory = makeHistory(6);

test('E1: selectRange(history, 0, 0) → Set с 1 элементом (history[0].id)', () => {
  const result = selectRange(sampleHistory, 0, 0);
  assert(result.size === 1 && result.has(sampleHistory[0].id), 'Ожидался Set с history[0].id');
});
test('E2: selectRange(history, 0, 2) → Set с 3 элементами', () => {
  const result = selectRange(sampleHistory, 0, 2);
  assert(result.size === 3, `Ожидался размер 3, получено ${result.size}`);
});
test('E3: selectRange(history, 2, 0) === selectRange(history, 0, 2) — обратный порядок работает', () => {
  const forward = selectRange(sampleHistory, 0, 2);
  const backward = selectRange(sampleHistory, 2, 0);
  assert(forward.size === backward.size && [...forward].every(id => backward.has(id)), 'Обратный порядок даёт другой результат');
});
test('E4: selectRange(history, 1, 3) → ids history[1], history[2], history[3]', () => {
  const result = selectRange(sampleHistory, 1, 3);
  assert(
    result.has(sampleHistory[1].id) && result.has(sampleHistory[2].id) && result.has(sampleHistory[3].id),
    'Не все ожидаемые id в Set'
  );
});
test('E5: selectRange(history, 0, history.length-1) → все элементы', () => {
  const result = selectRange(sampleHistory, 0, sampleHistory.length - 1);
  assert(result.size === sampleHistory.length, `Ожидался размер ${sampleHistory.length}, получено ${result.size}`);
});
test('E6: пустая история → пустой Set', () => {
  const result = selectRange([], 0, 2);
  assert(result.size === 0, `Ожидался пустой Set, получено размер ${result.size}`);
});
test('E7: startIndex === endIndex → ровно 1 элемент', () => {
  const result = selectRange(sampleHistory, 2, 2);
  assert(result.size === 1, `Ожидался размер 1, получено ${result.size}`);
});
test('E8: индекс за пределами → пропускается (нет ошибки)', () => {
  let error = false;
  try {
    selectRange(sampleHistory, 0, 100);
  } catch {
    error = true;
  }
  assert(!error, 'Выброшена ошибка при индексе за пределами');
});
test('E9: возвращает Set (не массив)', () => {
  const result = selectRange(sampleHistory, 0, 2);
  assert(result instanceof Set, 'Возвращён не Set');
});
test('E10: все id в Set принадлежат history', () => {
  const result = selectRange(sampleHistory, 1, 4);
  const allIds = new Set(sampleHistory.map(a => a.id));
  assert([...result].every(id => allIds.has(id)), 'В Set есть id не из history');
});
test('E11: selectRange(h, 2, 4) содержит ровно 3 элемента', () => {
  const result = selectRange(sampleHistory, 2, 4);
  assert(result.size === 3, `Ожидался размер 3, получено ${result.size}`);
});
test('E12: selectRange не мутирует историю', () => {
  const copy = [...sampleHistory];
  selectRange(sampleHistory, 0, 3);
  assert(sampleHistory.length === copy.length, 'История была мутирована');
});

// ─── Блок F: handleUndoSelected — отмена ─────────────────────────────────────
console.log('\nБлок F: handleUndoSelected — отмена');

test('F1: пустой selected → onUndo не вызывается (callCount === 0)', () => {
  let count = 0;
  const { callCount } = handleUndoSelected(new Set(), () => { count++; });
  assert(callCount === 0 && count === 0, `Ожидался callCount 0, получено ${callCount}`);
});
test('F2: onUndo === undefined → callCount === 0', () => {
  const { callCount } = handleUndoSelected(new Set(['a', 'b']), undefined);
  assert(callCount === 0, `Ожидался callCount 0, получено ${callCount}`);
});
test('F3: selected с 1 элементом → onUndo вызван 1 раз', () => {
  let count = 0;
  const { callCount } = handleUndoSelected(new Set(['a']), () => { count++; });
  assert(callCount === 1 && count === 1, `Ожидался callCount 1, получено ${callCount}`);
});
test('F4: selected с 3 элементами → onUndo вызван 3 раза', () => {
  let count = 0;
  const { callCount } = handleUndoSelected(new Set(['a', 'b', 'c']), () => { count++; });
  assert(callCount === 3 && count === 3, `Ожидался callCount 3, получено ${callCount}`);
});
test('F5: selected с 5 элементами → onUndo вызван 5 раз', () => {
  let count = 0;
  const { callCount } = handleUndoSelected(new Set(['a', 'b', 'c', 'd', 'e']), () => { count++; });
  assert(callCount === 5 && count === 5, `Ожидался callCount 5, получено ${callCount}`);
});
test('F6: после вызова newSelected — пустой Set', () => {
  const { newSelected } = handleUndoSelected(new Set(['a', 'b']), () => {});
  assert(newSelected.size === 0, `Ожидался пустой Set, получено размер ${newSelected.size}`);
});
test('F7: если onUndo undefined — newSelected не меняется', () => {
  const original = new Set(['a', 'b']);
  const { newSelected } = handleUndoSelected(original, undefined);
  assert(newSelected === original, 'newSelected должен быть тем же объектом');
});
test('F8: если selected пустой — newSelected не меняется', () => {
  const original = new Set<string>();
  const { newSelected } = handleUndoSelected(original, () => {});
  assert(newSelected === original, 'newSelected должен быть тем же объектом');
});
test('F9: callCount === selected.size (при наличии onUndo)', () => {
  const selected = new Set(['x', 'y', 'z', 'w']);
  const { callCount } = handleUndoSelected(selected, () => {});
  assert(callCount === selected.size, `callCount ${callCount} !== selected.size ${selected.size}`);
});
test('F10: возвращает объект с callCount и newSelected', () => {
  const result = handleUndoSelected(new Set(['a']), () => {});
  assert('callCount' in result && 'newSelected' in result, 'Объект не содержит callCount или newSelected');
});

// ─── Блок G: getActionIcon — иконки и цвета ───────────────────────────────────
console.log('\nБлок G: getActionIcon — иконки и цвета');

test('G1: "add" → icon: "plus", colorClass содержит "green"', () => {
  const { icon, colorClass } = getActionIcon('add');
  assert(icon === 'plus' && colorClass.includes('green'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G2: "delete" → icon: "trash", colorClass содержит "red"', () => {
  const { icon, colorClass } = getActionIcon('delete');
  assert(icon === 'trash' && colorClass.includes('red'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G3: "move" → icon: "arrows", colorClass содержит "blue"', () => {
  const { icon, colorClass } = getActionIcon('move');
  assert(icon === 'arrows' && colorClass.includes('blue'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G4: "update" → icon: "edit", colorClass содержит "purple"', () => {
  const { icon, colorClass } = getActionIcon('update');
  assert(icon === 'edit' && colorClass.includes('purple'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G5: "connect" → icon: "link", colorClass содержит "cyan"', () => {
  const { icon, colorClass } = getActionIcon('connect');
  assert(icon === 'link' && colorClass.includes('cyan'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G6: "disconnect" → icon: "unlink", colorClass содержит "orange"', () => {
  const { icon, colorClass } = getActionIcon('disconnect');
  assert(icon === 'unlink' && colorClass.includes('orange'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G7: "duplicate" → icon: "copy", colorClass содержит "yellow"', () => {
  const { icon, colorClass } = getActionIcon('duplicate');
  assert(icon === 'copy' && colorClass.includes('yellow'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G8: неизвестный тип ("move_end") → icon: "circle", colorClass содержит "gray"', () => {
  const { icon, colorClass } = getActionIcon('move_end');
  assert(icon === 'circle' && colorClass.includes('gray'), `icon="${icon}", colorClass="${colorClass}"`);
});
test('G9: возвращает объект с полями icon и colorClass', () => {
  const result = getActionIcon('add');
  assert('icon' in result && 'colorClass' in result, 'Объект не содержит icon или colorClass');
});
test('G10: icon — непустая строка', () => {
  const { icon } = getActionIcon('add');
  assert(typeof icon === 'string' && icon.length > 0, 'icon пустой или не строка');
});
test('G11: colorClass — непустая строка', () => {
  const { colorClass } = getActionIcon('add');
  assert(typeof colorClass === 'string' && colorClass.length > 0, 'colorClass пустой или не строка');
});
test('G12: все 7 известных типов имеют уникальные иконки', () => {
  const knownTypes: ActionType[] = ['add', 'delete', 'move', 'update', 'connect', 'disconnect', 'duplicate'];
  const icons = knownTypes.map(t => getActionIcon(t).icon);
  assert(new Set(icons).size === icons.length, `Есть дублирующиеся иконки: ${icons}`);
});

// ─── Блок H: интеграция — сценарии использования ─────────────────────────────
console.log('\nБлок H: интеграция — сценарии использования');

test('H1: добавить 3 действия → выбрать все через selectRange → handleUndoSelected вызывает onUndo 3 раза', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'a');
  h = addAction(h, 'delete', 'b');
  h = addAction(h, 'move', 'c');
  const selected = selectRange(h, 0, 2);
  let count = 0;
  const { callCount } = handleUndoSelected(selected, () => { count++; });
  assert(callCount === 3 && count === 3, `Ожидался callCount 3, получено ${callCount}`);
});
test('H2: добавить 5 действий → toggleActionSelection для 2 → handleUndoSelected вызывает onUndo 2 раза', () => {
  let h: Action[] = [];
  for (let i = 0; i < 5; i++) h = addAction(h, 'add', `a${i}`);
  let selected = new Set<string>();
  selected = toggleActionSelection(selected, h[0].id);
  selected = toggleActionSelection(selected, h[2].id);
  let count = 0;
  const { callCount } = handleUndoSelected(selected, () => { count++; });
  assert(callCount === 2 && count === 2, `Ожидался callCount 2, получено ${callCount}`);
});
test('H3: добавить действие → toggle его id → toggle снова → selected пустой', () => {
  const h = addAction([], 'add', 'test');
  let selected = new Set<string>();
  selected = toggleActionSelection(selected, h[0].id);
  selected = toggleActionSelection(selected, h[0].id);
  assert(selected.size === 0, `Ожидался пустой Set, получено размер ${selected.size}`);
});
test('H4: selectRange(0, 1) → toggle одного из них → в selected 1 элемент', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'a');
  h = addAction(h, 'delete', 'b');
  let selected = selectRange(h, 0, 1);
  selected = toggleActionSelection(selected, h[0].id);
  assert(selected.size === 1, `Ожидался размер 1, получено ${selected.size}`);
});
test('H5: 50 addAction → история ровно 50 элементов, все id уникальны', () => {
  let h: Action[] = [];
  for (let i = 0; i < 50; i++) h = addAction(h, 'add', `a${i}`);
  const ids = h.map(a => a.id);
  assert(h.length === 50 && new Set(ids).size === 50, `length=${h.length}, unique ids=${new Set(ids).size}`);
});
test('H6: добавить "add" и "delete" → оба в истории, порядок правильный', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'first');
  h = addAction(h, 'delete', 'second');
  assert(h[0].type === 'delete' && h[1].type === 'add', `Порядок неверный: ${h.map(a => a.type)}`);
});
test('H7: selectRange обратный (3, 1) === selectRange прямой (1, 3)', () => {
  const h = makeHistory(6);
  const forward = selectRange(h, 1, 3);
  const backward = selectRange(h, 3, 1);
  assert(forward.size === backward.size && [...forward].every(id => backward.has(id)), 'Прямой и обратный диапазоны различаются');
});
test('H8: handleUndoSelected с пустым selected → история не меняется', () => {
  let h: Action[] = [];
  h = addAction(h, 'add', 'a');
  const lenBefore = h.length;
  handleUndoSelected(new Set(), () => {});
  assert(h.length === lenBefore, 'История изменилась');
});
test('H9: добавить действие → его id есть в history[0].id', () => {
  const h = addAction([], 'update', 'test');
  assert(typeof h[0].id === 'string' && h[0].id.length > 0, 'id в history[0] некорректный');
});
test('H10: selectRange(0, 0) → Set содержит только history[0].id', () => {
  const h = makeHistory(4);
  const result = selectRange(h, 0, 0);
  assert(result.size === 1 && result.has(h[0].id), 'Set не содержит только history[0].id');
});
test('H11: 3 toggle одного id → selected содержит id (нечётное число = добавлен)', () => {
  let selected = new Set<string>();
  selected = toggleActionSelection(selected, 'abc');
  selected = toggleActionSelection(selected, 'abc');
  selected = toggleActionSelection(selected, 'abc');
  assert(selected.has('abc'), 'После 3 toggle id должен быть в Set');
});
test('H12: история не мутируется при addAction (возвращает новый массив)', () => {
  const original: Action[] = [];
  const result = addAction(original, 'add', 'test');
  assert(result !== original, 'addAction вернул тот же массив');
  assert(original.length === 0, 'Исходный массив был мутирован');
});

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
