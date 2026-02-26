/**
 * @fileoverview Компонент мобильных ответов пользователя
 * @description Отображает превью ответов в мобильной карточке
 */

import { Badge } from '@/components/ui/badge';
import type { UserResponsesPreviewProps } from '../types';
import { parseResponseData } from '../utils';

/**
 * Компонент превью ответов для мобильной карточки
 * @param props - Пропсы компонента
 * @returns JSX компонент или null
 */
export function MobileUserResponses({
  user,
  maxLength = 50,
}: UserResponsesPreviewProps): React.JSX.Element | null {
  if (!user.userData || Object.keys(user.userData).length === 0) {
    return null;
  }

  const entries = Object.entries(user.userData);
  const firstEntry = entries[0];

  if (!firstEntry) return null;

  const [key, value] = firstEntry;
  const responseData = parseResponseData(value);

  return (
    <div className="border-t pt-3">
      <div className="text-sm font-medium mb-2">Последние ответы:</div>
      <div className="space-y-2">
        <div key={key} className="text-xs bg-muted/50 rounded-lg p-2">
          <div className="text-muted-foreground mb-1">{String(key)}:</div>
          <div className="font-medium">
            {responseData.value
              ? (responseData.value.length > maxLength ? `${responseData.value.substring(0, maxLength)}...` : String(responseData.value))
              : (typeof value === 'string' ? (value.length > maxLength ? `${value.substring(0, maxLength)}...` : value) : JSON.stringify(value))}
          </div>
        </div>
        {entries.length > 1 && (
          <div className="text-xs text-muted-foreground">
            +{entries.length - 1} еще...
          </div>
        )}
      </div>
    </div>
  );
}
