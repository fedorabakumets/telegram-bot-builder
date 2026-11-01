/** @fileoverview Навигация по пользовательским таблицам проекта; системные таблицы скрыты. */
import { getTableLabel } from '../utils/display-labels';
import { useState } from 'react';
import { Plus, Table2, Trash2, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/utils';
import { TableCreateForm } from './table-create-form';
import type { BotTable } from '../types';

/** Свойства списка таблиц. */
interface TableListProps {
  /** Скрытие списка без удаления его состояния. */
  collapsed?: boolean;
  /** Доступные таблицы. */
  tables: BotTable[];
  /** Идентификатор выбранной таблицы. */
  selectedTableId: string | null;
  /** Выбор таблицы. */
  onSelect: (tableId: string) => void;
  /** Создание таблицы. */
  onCreate: (name: string) => void | Promise<void>;
  /** Удаление таблицы. */
  onDelete: (tableId: string) => void;
}
/**
 * Возвращает название без служебных значков и внутренних имён.
 * @param table - Таблица проекта.
 * @returns Понятное название таблицы.
 */
function tableLabel(table: BotTable) {
  return getTableLabel(table.name);
}
/**
 * Показывает поиск, группы таблиц и форму создания.
 * @param props - Таблицы и обработчики действий.
 * @returns Боковая навигация по данным.
 */
export function TableList({ tables, selectedTableId, onSelect, onCreate, onDelete, collapsed = false }: TableListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  /** Системные таблицы скрываются только в интерфейсе, их данные сохраняются. */
  const filtered = tables.filter((table) => !table.id.startsWith('_system_') && tableLabel(table).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  /** В навигации отображаются только таблицы проекта. */
  const groups = [
    { label: 'Таблицы проекта', hint: 'Ваши данные', items: filtered.filter((table) => !table.id.startsWith('_system_')).sort((a, b) => Number(b.name === '_content') - Number(a.name === '_content')) },
  ];
  return (
    <aside aria-label="Список таблиц" className={cn('tables-list flex h-full min-h-0 shrink-0 flex-col', collapsed ? 'hidden' : 'w-full sm:w-64')}>
      <div className="flex items-center justify-between gap-2 p-2">
        {!collapsed && <span className="px-1 text-xs font-medium text-muted-foreground">Список таблиц</span>}

      </div>
      <div hidden={collapsed} className={cn('min-h-0 flex-1 flex-col', collapsed ? 'hidden' : 'flex')}>
      <div className="space-y-3 p-3">
        <Button variant="outline" className="tables-control w-full justify-start gap-2 text-sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />Новая таблица
        </Button>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Поиск таблиц" placeholder="Найти таблицу" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10 text-sm" />
        </div>
        {isCreating && <TableCreateForm onCreate={onCreate} onCancel={() => setIsCreating(false)} />}
      </div>
      <nav aria-label="Таблицы проекта" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {groups.map((group) => group.items.length > 0 && (
          <section key={group.label}>
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground">{group.label}</h3>
              <span className="text-xs text-muted-foreground">{group.items.length}</span>
            </div>
            <div className="space-y-1">
              {group.items.map((table) => {
                const system = table.id.startsWith('_system_');
                const active = selectedTableId === table.id;
                return (
                  <div key={table.id} className={cn('tables-row group flex items-center rounded-md', active && 'is-selected')}>
                    <button type="button" aria-current={active ? 'page' : undefined} title={`${tableLabel(table)}${system ? ' · Только чтение' : ''}`}
                      onClick={() => onSelect(table.id)} className="tables-control flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm">
                      {system ? <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Table2 className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="min-w-0 flex-1 truncate">{tableLabel(table)}</span>
                      {(system || active) && <span className="text-xs tabular-nums text-muted-foreground">{table.rows.length}</span>}
                      {table.name === '_content' && <span className="text-xs text-muted-foreground">Авто</span>}
                    </button>
                    {!system && table.name !== '_content' && (
                      <Button size="icon" variant="ghost" aria-label={`Удалить таблицу ${tableLabel(table)}`} title="Удалить таблицу"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        onClick={() => onDelete(table.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 && <p role="status" className="px-2 py-4 text-sm text-muted-foreground">{search ? 'Таблицы не найдены. Измените запрос.' : 'Создайте таблицу для своих данных.'}</p>}
      </nav>
      </div>
    </aside>
  );
}
