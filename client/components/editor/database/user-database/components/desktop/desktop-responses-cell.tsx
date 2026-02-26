/**
 * @fileoverview Компонент ячейки ответов пользователя
 * @description Отображает превью ответов пользователя
 */

import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента DesktopResponsesCell
 */
interface DesktopResponsesCellProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент ячейки ответов
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopResponsesCell({ user }: DesktopResponsesCellProps): React.JSX.Element {
  if (!user.userData || Object.keys(user.userData).length === 0) {
    return (
      <TableCell className="py-2">
        <span className="text-xs text-muted-foreground/60">-</span>
      </TableCell>
    );
  }

  const entries = Object.entries(user.userData);
  const [key, value] = entries[0];

  let responseData: any = value;
  if (typeof value === 'string') {
    try {
      responseData = JSON.parse(value);
    } catch {
      responseData = { value: value, type: 'text' };
    }
  }

  const answer = responseData?.value
    ? (responseData.value.length > 30 ? `${responseData.value.substring(0, 30)}...` : String(responseData.value))
    : (typeof value === 'string' ? (value.length > 30 ? `${value.substring(0, 30)}...` : value) : '');

  return (
    <TableCell className="py-2 max-w-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div key={key} className="text-xs text-muted-foreground truncate">
            <span className="inline-block truncate max-w-full">{answer}</span>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          {entries.length}
        </Badge>
      </div>
    </TableCell>
  );
}
