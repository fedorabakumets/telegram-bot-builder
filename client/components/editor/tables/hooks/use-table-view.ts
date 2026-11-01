/** @fileoverview Поиск, фильтрация и сортировка строк с учётом названий нод. */
import { useMemo, useState } from 'react';
import type { CanvasSheet } from '@shared/schema';
import type { BotTable } from '../types';
import { createContentResolver } from '../utils/content-record';
import { useTablePreference } from './use-table-preference';
/**
 * Подготавливает отображаемые записи и настройки представления.
 * @param table - Таблица проекта.
 * @param projectId - Проект для сохранения настроек.
 * @param sheets - Листы для распознавания записей контента.
 * @returns Фильтры, найденные строки и функции управления.
 */
export function useTableView(table: BotTable, projectId: number, sheets?: CanvasSheet[]) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeCell, setActiveCell] = useState<{ /** Строка начальной ячейки. */ rowId: number; /** Столбец начальной ячейки. */ columnId: string } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: string; direction: number } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [wrap, setWrap] = useTablePreference(`tables:${projectId}:${table.id}:wrap`, false);
  const [widths, setWidths] = useTablePreference<Record<string, number>>(`tables:${projectId}:${table.id}:widths`, {});
  const content = table.name === '_content';
  const keyId = table.columns.find((column) => column.name === 'key')?.id;
  const typeId = table.columns.find((column) => column.name === 'type')?.id;
  const sheetId = table.columns.find((column) => column.name === 'sheet')?.id;
  const resolve = useMemo(() => createContentResolver(sheets), [sheets]);
  const records = useMemo(() => content ? new Map(table.rows.map((row) => [row.id, resolve(keyId ? row.cells[keyId] ?? '' : '')])) : new Map(), [table.rows, keyId, resolve, content]);
  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const found = table.rows.filter((row) => {
      if (content && selectedType && typeId && row.cells[typeId] !== selectedType) return false;
      if (content && selectedSheet && sheetId && row.cells[sheetId] !== selectedSheet) return false;
      if (Object.entries(columnFilters).some(([id, filter]) => filter && !(row.cells[id] ?? '').toLocaleLowerCase().includes(filter.toLocaleLowerCase()))) return false;
      const meta = records.get(row.id);
      return !query || [...Object.values(row.cells), ...(content && meta ? [meta.title, meta.field, meta.nodeId] : [])].some((value) => value.toLocaleLowerCase().includes(query));
    });
    return sort ? found.sort((a, b) => {
      const column = table.columns.find((item) => item.id === sort.column);
      const left = content && sort.column === keyId ? records.get(a.id)?.title ?? '' : a.cells[sort.column] ?? '';
      const right = content && sort.column === keyId ? records.get(b.id)?.title ?? '' : b.cells[sort.column] ?? '';
      return (column?.settings?.dataType === 'number' && left.trim() && right.trim() && Number.isFinite(Number(left.replace(',', '.'))) && Number.isFinite(Number(right.replace(',', '.'))) ? Number(left.replace(',', '.')) - Number(right.replace(',', '.')) : left.localeCompare(right, 'ru', { numeric: true })) * sort.direction;
    }) : found;
  }, [table.rows, table.columns, content, selectedType, typeId, selectedSheet, sheetId, columnFilters, search, records, sort]);
  /** Очищает все ограничения выборки одним действием. */
  function reset() { setSearch(''); setSelectedType(null); setSelectedSheet(null); setColumnFilters({}); }
  return { selected, setSelected, activeCell, setActiveCell, rows, records, search, setSearch, selectedType, setSelectedType, selectedSheet, setSelectedSheet, sort, setSort, columnFilters, setColumnFilters, wrap, setWrap, widths, setWidths, reset };
}
/** Состояние представления, общее для компонентов таблицы. */
export type TableView = ReturnType<typeof useTableView>;
