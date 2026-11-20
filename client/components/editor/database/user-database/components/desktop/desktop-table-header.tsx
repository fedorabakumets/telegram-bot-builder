/**
 * @fileoverview Компонент заголовка таблицы пользователей
 * @description Отображает заголовки колонок таблицы с учётом видимости
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useDirectoryControls } from '../../content/user-directory-controls';
import type { SortField } from '../../types';

/**
 * Пропсы компонента заголовка таблицы
 */
interface DesktopTableHeaderProps {
  /** Количество видимых колонок */
  visibleColumns?: number;
}

/**
 * Конфигурация колонок таблицы
 */
const COLUMNS_CONFIG = [
  { key: 'user', field: 'firstName', label: 'Пользователь', alwaysVisible: true },
  { key: 'source', field: 'acquisitionSource', label: 'Источник', alwaysVisible: true },
  { key: 'variables', field: 'variableCount', label: 'Переменные', alwaysVisible: true },
  { key: 'messages', field: 'incomingMessageCount', label: 'Сообщения', alwaysVisible: true, align: 'right' as const },
  { key: 'clicks', field: 'buttonClickCount', label: 'Нажатия', alwaysVisible: true, align: 'right' as const },
  { key: 'activity', field: 'lastInteraction', label: 'Последняя активность', alwaysVisible: true },
  { key: 'status', field: 'userStatus', label: 'Статус', alwaysVisible: true },
  { key: 'actions', label: 'Действия', alwaysVisible: true, align: 'right' as const },
];

/**
 * Компонент заголовка таблицы пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка таблицы
 */
export function DesktopTableHeader({ visibleColumns = 5 }: DesktopTableHeaderProps): React.JSX.Element {
  const controls = useDirectoryControls();
  const activeField = controls?.field ?? 'lastInteraction';
  const direction = controls?.direction ?? 'desc';
  /** Источник сначала показывает крупнейшую аудиторию; повторный клик меняет направление. */
  function nextDirection(field?: string): 'asc' | 'desc' {
    if (field === activeField) return direction === 'asc' ? 'desc' : 'asc';
    return field === 'acquisitionSource' ? 'desc' : 'asc';
  }
  // Всегда показываем обязательные колонки + дополнительные по visibleColumns
  const alwaysVisible = COLUMNS_CONFIG.filter(col => col.alwaysVisible);
  const optional = COLUMNS_CONFIG.filter(col => !col.alwaysVisible);
  
  // Показываем все обязательные + первые N опциональных
  const columnsToShow = [...alwaysVisible, ...optional.slice(0, Math.max(0, visibleColumns - alwaysVisible.length))];

  return (
    <TableHeader className="bg-muted/20">
      <TableRow className="border-b border-border/50 hover:bg-transparent">
        {columnsToShow.map((column) => (
          <TableHead
            key={column.key}
            aria-sort={column.field === activeField ? (direction === 'asc' ? 'ascending' : 'descending') : column.field ? 'none' : undefined}
            className={`text-xs font-medium h-10 ${column.align === 'right' ? 'text-right' : ''}`}
          >
            {column.field && controls ? <button type="button" className="users-sort-button" title={column.field === 'acquisitionSource' ? 'По количеству пользователей источника' : undefined}
              onClick={() => controls.sort(column.field as SortField, nextDirection(column.field))}
              aria-label={`${column.label}: ${nextDirection(column.field) === 'desc' ? 'по убыванию' : 'по возрастанию'}`}>
              <span title={column.label}>{column.label}</span>
              {column.field === activeField ? (direction === 'asc' ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />) : <ArrowUpDown aria-hidden="true" />}
            </button> : column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
