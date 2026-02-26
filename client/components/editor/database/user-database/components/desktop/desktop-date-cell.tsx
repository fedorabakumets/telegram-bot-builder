/**
 * @fileoverview Компонент ячейки даты
 * @description Отображает дату в формате dd.mm.yyyy
 */

import { TableCell } from '@/components/ui/table';
import { formatDate } from '../../utils/format-date';

/**
 * Пропсы компонента DesktopDateCell
 */
interface DesktopDateCellProps {
  /** Значение даты */
  date: unknown;
}

/**
 * Компонент ячейки даты
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopDateCell({ date }: DesktopDateCellProps): React.JSX.Element {
  return (
    <TableCell className="py-2 text-xs text-muted-foreground">
      {formatDate(date) || '-'}
    </TableCell>
  );
}
