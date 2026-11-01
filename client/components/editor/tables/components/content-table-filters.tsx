/**
 * @fileoverview Компактные фильтры контента по типу и листу сценария
 * @module editor/tables/components/content-table-filters
 */

import { useMemo } from 'react';
import type { TableRow, TableColumn } from '../types';

/** Пропсы компонента фильтров контент-таблицы */
interface ContentTableFiltersProps {
  /** Строки таблицы */
  rows: TableRow[];
  /** Колонки таблицы (для маппинга id → name) */
  columns: TableColumn[];
  /** Выбранный фильтр по type */
  selectedType: string | null;
  /** Выбранный фильтр по sheet */
  selectedSheet: string | null;
  /** Обработчик смены фильтра type */
  onTypeChange: (type: string | null) => void;
  /** Обработчик смены фильтра sheet */
  onSheetChange: (sheet: string | null) => void;
}

/**
 * Компактная строка выбора типа и листа без роста от количества значений
 * @param props - Пропсы компонента
 * @returns JSX элемент фильтров
 */
export function ContentTableFilters({
  rows,
  columns,
  selectedType,
  selectedSheet,
  onTypeChange,
  onSheetChange,
}: ContentTableFiltersProps) {
  /** ID колонки type */
  const typeColId = useMemo(
    () => columns.find((c) => c.name === 'type')?.id,
    [columns],
  );

  /** ID колонки sheet */
  const sheetColId = useMemo(
    () => columns.find((c) => c.name === 'sheet')?.id,
    [columns],
  );

  /** Уникальные значения type */
  const types = useMemo(() => {
    if (!typeColId) return [];
    const set = new Set<string>();
    rows.forEach((r) => {
      const v = r.cells[typeColId];
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [rows, typeColId]);

  /** Уникальные значения sheet */
  const sheets = useMemo(() => {
    if (!sheetColId) return [];
    const set = new Set<string>();
    rows.forEach((r) => {
      const v = r.cells[sheetColId];
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [rows, sheetColId]);

  return (
    <div className="content-table-filters shrink-0 flex flex-wrap items-center gap-3 px-4 py-3" aria-label="Фильтры контента">
      <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="shrink-0">Тип</span>
        <select aria-label="Тип контента" className="content-filter-select min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          value={selectedType ?? ''} onChange={(event) => onTypeChange(event.target.value || null)}>
          <option value="">Все типы</option>
          {types.map((type) => <option key={type} value={type}>{type === 'command' ? 'Команды' : type === 'message' ? 'Сообщения' : type}</option>)}
        </select>
      </label>
      {sheets.length > 0 && (
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="shrink-0">Лист</span>
          <select aria-label="Лист сценария" title={selectedSheet ?? 'Все листы'} className="content-filter-select min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
            value={selectedSheet ?? ''} onChange={(event) => onSheetChange(event.target.value || null)}>
            <option value="">Все листы</option>
            {sheets.map((sheet) => <option key={sheet} value={sheet}>{sheet}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
