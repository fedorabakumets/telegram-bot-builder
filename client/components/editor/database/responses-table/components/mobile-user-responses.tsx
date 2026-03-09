/**
 * @fileoverview Компонент мобильных ответов пользователя
 * @description Отображает превью ответов в мобильной карточке
 */

import type { UserResponsesPreviewProps } from '../types';
import { parseResponseData } from '../utils';

/**
 * Компонент превью ответов для мобильной карточки
 * @param props - Пропсы компонента
 * @returns JSX компонент или null
 */
export function MobileUserResponses({
  user,
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
            {(() => {
              const responseValue = String(responseData.value ?? '');
              const valueStr = String(value);
              return responseValue.length > 50 ? `${responseValue.substring(0, 50)}...` : responseValue || (valueStr.length > 50 ? `${valueStr.substring(0, 50)}...` : valueStr);
            })()}
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
