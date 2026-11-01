/** @fileoverview Поиск по записям, счётчик результатов и перенос текста. */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { TableView } from '../hooks/use-table-view';
/** Свойства панели представления. */
interface TableViewToolbarProps {
  /** Дополнительные действия текущей таблицы. */
  children?: ReactNode;
  /** Состояние поиска и фильтров. */
  view: TableView;
  /** Данные ещё загружаются. */
  loading?: boolean;
  /** Общее количество записей. */
  total: number;
}
/**
 * Показывает поиск, результат выборки и настройки строк.
 * @param props - Представление и общее число записей.
 * @returns Панель поиска и управления отображением.
 */
export function TableViewToolbar({ view, total, children, loading }: TableViewToolbarProps) {
  const filtered = Boolean(view.search || view.selectedType || view.selectedSheet || Object.values(view.columnFilters).some(Boolean));
  return (
    <div className="table-view-toolbar flex shrink-0 flex-wrap items-center gap-3 px-4 py-2">
      <Input aria-label="Поиск по записям" value={view.search} placeholder="Поиск по нодам и содержимому" className="min-w-0 flex-1 basis-48 text-sm" onChange={(event) => view.setSearch(event.target.value)} />
      <span role="status" className="text-xs text-muted-foreground tabular-nums">{loading ? 'Загрузка данных…' : `Найдено ${view.rows.length} из ${total}`}</span>
      {filtered && <button type="button" aria-label="Сбросить фильтры" title="Сбросить фильтры" onClick={view.reset} className="tables-control rounded-md border border-border p-2"><X className="h-4 w-4" /></button>}
      {children}
    </div>
  );
}
