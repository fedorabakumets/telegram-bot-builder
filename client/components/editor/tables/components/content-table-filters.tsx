/**
 * @fileoverview Фильтры для таблицы _content — чипсы по type и sheet
 * @module editor/tables/components/content-table-filters
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
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
 * Горизонтальная полоска чипсов для фильтрации по type и sheet
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
    <div className="px-4 py-2 border-b border-border/50 flex flex-col gap-1.5">
      {/* Фильтр по type */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-muted-foreground mr-1">type:</span>
        <Chip active={!selectedType} onClick={() => onTypeChange(null)}>Все</Chip>
        {types.map((t) => (
          <Chip key={t} active={selectedType === t} onClick={() => onTypeChange(t)}>
            {t}
          </Chip>
        ))}
      </div>
      {/* Фильтр по sheet */}
      {sheets.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground mr-1">sheet:</span>
          <Chip active={!selectedSheet} onClick={() => onSheetChange(null)}>Все</Chip>
          {sheets.map((s) => (
            <Chip key={s} active={selectedSheet === s} onClick={() => onSheetChange(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

/** Пропсы чипса-кнопки */
interface ChipProps {
  /** Активен ли чипс */
  active: boolean;
  /** Обработчик клика */
  onClick: () => void;
  /** Содержимое */
  children: React.ReactNode;
}

/** Чипс-кнопка фильтра */
function Chip({ active, onClick, children }: ChipProps) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn(
        'h-5 px-2 text-[10px] rounded-full',
        active && 'bg-primary/10 text-primary font-medium',
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
