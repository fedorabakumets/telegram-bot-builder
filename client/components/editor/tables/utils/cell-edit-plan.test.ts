/** @fileoverview Проверки диапазонов: первая строка, пустые ячейки, защищённые поля и границы. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseClipboardTsv } from './parse-clipboard';
import { pastePlan, replacementPlan } from './cell-edit-plan';
import type { BotTable } from '../types';
/** Пользовательская таблица для проверки диапазонов. */
const table: BotTable = { id: '1', name: 'Товары', columns: [{ id: '1', name: 'Название' }, { id: '2', name: 'Цена' }], rows: [
  { id: 1, rowIndex: 1, cells: { '1': 'Первый товар', '2': '10' } },
  { id: 2, rowIndex: 2, cells: { '1': 'Второй товар', '2': '20' } },
] };
test('Первая текстовая строка диапазона не теряется как предполагаемый заголовок', () => {
  assert.deepEqual(parseClipboardTsv('Первый\t10\r\nВторой\t20\r\n').rows, [['Первый', '10'], ['Второй', '20']]);
});
test('Кавычки, переносы внутри ячейки и конечный пустой столбец сохраняются', () => {
  assert.deepEqual(parseClipboardTsv('"Первая\nвторая"\t\n').rows, [['Первая\nвторая', '']]);
});
test('План вставки сохраняет исходные значения и не изменяет исходный объект', () => {
  const plan = pastePlan(table, table.rows, 1, '1', 'Новое\t30\nЕщё\t40');
  assert.equal(plan.edits.length, 4); assert.equal(plan.edits[0].before, 'Первый товар');
  assert.equal(table.rows[0].cells['1'], 'Первый товар'); assert.deepEqual(plan.errors, []);
});
test('Выход за границы явно блокирует применение диапазона', () => {
  assert.ok(pastePlan(table, table.rows, 2, '2', '1\t2').errors.length > 0);
});
test('Защищённые столбцы контента не изменяются массовой заменой', () => {
  const content = { ...table, name: '_content', columns: [{ id: '1', name: 'key' }, { id: '2', name: 'value' }] };
  const plan = replacementPlan(content, content.rows, 'товар', 'текст', '');
  assert.equal(plan.edits.length, 0);
  assert.ok(pastePlan(content, content.rows, 1, '1', 'Новое').errors.length > 0);
});
