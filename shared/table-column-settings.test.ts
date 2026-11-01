/** @fileoverview Проверки типов столбцов и одинаковой валидации ячеек и диапазонов. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { columnSettings, validateColumnValue, tableColumnSettingsSchema } from './table-column-settings';
import { validateImportPreview } from '../client/components/editor/tables/utils/import-preview';
import { pastePlan } from '../client/components/editor/tables/utils/cell-edit-plan';

test('Числа принимают десятичную запятую, но проверяют диапазон и посторонний текст', () => {
  const settings = columnSettings({ dataType: 'number', min: 1, max: 20 });
  assert.equal(validateColumnValue('12,5', settings), null);
  assert.ok(validateColumnValue('0', settings)); assert.ok(validateColumnValue('21', settings));
  assert.ok(validateColumnValue('12 рублей', settings)); assert.ok(validateColumnValue('Infinity', settings));
});
test('Дата проверяется по календарю, а не только по формату', () => {
  const settings = columnSettings({ dataType: 'date' });
  assert.equal(validateColumnValue('2024-02-29', settings), null);
  assert.ok(validateColumnValue('2025-02-29', settings)); assert.ok(validateColumnValue('2026-13-01', settings));
});
test('Переключатель не преобразует произвольный текст в истинное значение', () => {
  const settings = columnSettings({ dataType: 'boolean' });
  assert.equal(validateColumnValue('false', settings), null); assert.equal(validateColumnValue('true', settings), null);
  assert.ok(validateColumnValue('да', settings));
});
test('Ссылка требует допустимый протокол', () => {
  const settings = columnSettings({ dataType: 'link' });
  assert.equal(validateColumnValue('https://example.com/catalog', settings), null);
  assert.ok(validateColumnValue('javascript:alert(1)', settings)); assert.ok(validateColumnValue('example.com', settings));
});
test('Обязательность, длина текста и границы настроек проверяются отдельно', () => {
  assert.ok(validateColumnValue('  ', columnSettings({ required: true })));
  assert.ok(validateColumnValue('    ', columnSettings({ maxLength: 3 })));
  assert.equal(validateColumnValue('', columnSettings()), null);
  assert.equal(tableColumnSettingsSchema.safeParse({ min: 10, max: 1 }).success, false);
});
test('Предпросмотр импорта и диапазона отклоняет те же значения, что и ячейка', () => {
  const column = { id: '1', name: 'price', settings: columnSettings({ displayName: 'Цена', dataType: 'number', min: 0 }) };
  assert.equal(validateImportPreview(['price'], [['12,5']], [column]).length, 0);
  assert.ok(validateImportPreview(['price'], [['-1']], [column]).length);
  const table = { id: '1', name: 'Товары', columns: [column], rows: [{ id: 1, rowIndex: 1, cells: { '1': '10' } }] };
  assert.ok(pastePlan(table, table.rows, 1, '1', 'Ошибка').errors.length);
});
