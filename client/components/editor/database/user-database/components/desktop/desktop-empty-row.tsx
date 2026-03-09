/**
 * @fileoverview Компонент пустой строки таблицы
 * @description Отображается когда пользователей нет
 */

import { TableRow, TableCell } from '@/components/ui/table';
import { Users } from 'lucide-react';

/**
 * Пропсы компонента DesktopEmptyRow
 */
interface DesktopEmptyRowProps {
  /** Поисковый запрос для отображения соответствующего сообщения */
  searchQuery: string;
}

/**
 * Компонент пустой строки таблицы
 * @param props - Пропсы компонента
 * @returns JSX компонент пустой строки
 */
export function DesktopEmptyRow({ searchQuery }: DesktopEmptyRowProps): React.JSX.Element {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Users className="w-8 h-8 opacity-30" />
          <span>{searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
