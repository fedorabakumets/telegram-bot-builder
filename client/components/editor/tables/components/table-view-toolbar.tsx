/** @fileoverview Поиск по записям и общая строка навигации и действий таблицы. */
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { TableView } from '../hooks/use-table-view';
/** Свойства панели представления. */
interface TableViewToolbarProps {
  /** Возврат к списку в одной строке с действиями. */
  navigation?: ReactNode;
  /** Фильтры между общей строкой действий и поиском. */
  filters?: ReactNode;
  /** Дополнительные действия текущей таблицы. */
  children?: ReactNode;
  /** Состояние поиска и фильтров. */
  view: TableView;
}
/**
 * Размещает поиск рядом с навигацией и действиями таблицы.
 * @param props - Представление и общее число записей.
 * @returns Панель поиска и управления отображением.
 */
export function TableViewToolbar({ view, children, navigation, filters }: TableViewToolbarProps) {
  const filtered = Boolean(view.search || view.selectedType || view.selectedSheet || Object.values(view.columnFilters).some(Boolean));
  return (
    <div className="table-view-toolbar flex shrink-0 flex-col gap-2 py-2">
      <div className="table-view-actions flex min-w-0 flex-wrap items-center gap-2 px-3">
        {navigation}
        <div className="table-view-search flex min-w-0 flex-1 items-center gap-2">
          <Input aria-label="Поиск по записям" value={view.search} placeholder="Поиск по нодам и содержимому" className="min-w-0 flex-1 text-sm" onChange={(event) => view.setSearch(event.target.value)} />
          {filtered && <button type="button" aria-label="Сбросить фильтры" title="Сбросить фильтры" onClick={view.reset} className="tables-control shrink-0 rounded-md border border-border p-2"><X className="h-4 w-4" /></button>}
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">{children}</div>
      </div>
      {filters}
    </div>
  );
}
