/**
 * @fileoverview Компонент заголовка таблицы пользователей
 * @description Отображает заголовки колонок таблицы с учётом видимости
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  { key: 'user', label: 'Пользователь', alwaysVisible: true },
  { key: 'actions', label: 'Действия', alwaysVisible: true, align: 'right' as const },
];

/**
 * Компонент заголовка таблицы пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка таблицы
 */
export function DesktopTableHeader({ visibleColumns = 5 }: DesktopTableHeaderProps): React.JSX.Element {
  // Всегда показываем обязательные колонки + дополнительные по visibleColumns
  const alwaysVisible = COLUMNS_CONFIG.filter(col => col.alwaysVisible);
  const optional = COLUMNS_CONFIG.filter(col => !col.alwaysVisible);
  
  // Показываем все обязательные + первые N опциональных
  const columnsToShow = [...alwaysVisible, ...optional.slice(0, Math.max(0, visibleColumns - alwaysVisible.length))];

  return (
    <TableHeader className="bg-muted/40 hover:bg-muted/50">
      <TableRow className="border-b border-border/50 hover:bg-transparent">
        {columnsToShow.map((column) => (
          <TableHead
            key={column.key}
            className={`font-semibold h-10 ${column.align === 'right' ? 'text-right' : ''}`}
          >
            {column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
