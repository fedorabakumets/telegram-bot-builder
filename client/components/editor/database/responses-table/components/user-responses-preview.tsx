/**
 * @fileoverview Компонент превью ответов пользователя
 * @description Отображает краткую информацию об ответах пользователя (для таблицы)
 */

import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import type { UserResponsesPreviewProps } from '../types';
import { parseResponseData } from '../utils';

/**
 * Компонент превью ответов для ячейки таблицы
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function UserResponsesPreview({
  user,
  maxLength = 30,
  showCount = true,
}: UserResponsesPreviewProps): React.JSX.Element {
  if (!user.userData || Object.keys(user.userData).length === 0) {
    return (
      <TableCell className="py-2">
        <span className="text-xs text-muted-foreground/60">-</span>
      </TableCell>
    );
  }

  const entries = Object.entries(user.userData);
  const [key, value] = entries[0];
  const responseData = parseResponseData(value);
  const answer = responseData.value
    ? (responseData.value.length > maxLength ? `${responseData.value.substring(0, maxLength)}...` : String(responseData.value))
    : (typeof value === 'string' ? (value.length > maxLength ? `${value.substring(0, maxLength)}...` : value) : '');

  return (
    <TableCell className="py-2 max-w-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div key={key} className="text-xs text-muted-foreground truncate">
            <span className="inline-block truncate max-w-full">{answer}</span>
          </div>
        </div>
        {showCount && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {entries.length}
          </Badge>
        )}
      </div>
    </TableCell>
  );
}
