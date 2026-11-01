/** @fileoverview Компактное меню операций диапазона и раздельного экспорта. */
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { tableToCsv } from '../utils/export-csv';
import { tableToJson } from '../utils/export-json';
import { downloadFile } from '../utils/download-file';
import type { TableView } from '../hooks/use-table-view';
import type { BotTable } from '../types';
/** Свойства меню массовых действий. */
interface TableBulkActionsProps {
  /** Полная таблица проекта. */
  table: BotTable;
  /** Текущая выборка и выделение. */
  view: TableView;
  /** Открытие предпросмотра операции. */
  onOpen: (mode: 'replace' | 'paste') => void;
  /** Изменение данных недоступно. */
  disabled: boolean;
}
/**
 * Оставляет операции рядом с поиском, не увеличивая высоту рабочей области.
 * @param props - Таблица, выборка и действия.
 * @returns Меню массового редактирования и экспорта.
 */
export function TableBulkActions({ table, view, onOpen, disabled }: TableBulkActionsProps) {
  const selected = table.rows.filter((row) => view.selected.has(row.id));
  const scope = selected.length ? selected : view.rows;
  /** Выгружает только выбранную область в подтверждённом пользователем формате. */
  function exportRows(all: boolean, json: boolean) {
    const rows = all ? table.rows : scope;
    downloadFile(json ? tableToJson(table.columns, rows) : tableToCsv(table.columns, rows), `${table.name}${all ? '' : '-selection'}.${json ? 'json' : 'csv'}`, json ? 'application/json' : 'text/csv;charset=utf-8');
  }
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="tables-control shrink-0 rounded-md border border-border px-3 py-2 text-sm">Действия{selected.length ? ` · ${selected.length}` : ''}</button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="table-actions-menu w-64">
      <DropdownMenuItem disabled={disabled || !scope.length} onSelect={() => onOpen('replace')}>Найти и заменить</DropdownMenuItem>
      <DropdownMenuItem disabled={disabled || !view.rows.length} onSelect={() => onOpen('paste')}>Вставить диапазон</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => exportRows(false, false)}>Экспорт выборки · CSV</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => exportRows(false, true)}>Экспорт выборки · JSON</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => exportRows(true, false)}>Экспорт всей таблицы · CSV</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => exportRows(true, true)}>Экспорт всей таблицы · JSON</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked={view.wrap} onCheckedChange={view.setWrap}>Перенос текста</DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
