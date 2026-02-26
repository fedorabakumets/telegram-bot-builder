/**
 * @fileoverview Компонент последних ответов пользователя (мобильный)
 * @description Отображает превью последних ответов пользователя в мобильной карточке
 */

import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента MobileUserResponses
 */
interface MobileUserResponsesProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент последних ответов для мобильной карточки
 * @param props - Пропсы компонента
 * @returns JSX компонент ответов или null
 */
export function MobileUserResponses({ user }: MobileUserResponsesProps): React.JSX.Element | null {
  if (!user.userData || Object.keys(user.userData).length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-3">
      <div className="text-sm font-medium mb-2">Последние ответы:</div>
      <div className="space-y-2">
        {Object.entries(user.userData).slice(0, 1).map(([key, value]) => {
          let responseData = value;
          if (typeof value === 'string') {
            try {
              responseData = JSON.parse(value);
            } catch {
              responseData = { value: value, type: 'text' };
            }
          }

          return (
            <div key={key} className="text-xs bg-muted/50 rounded-lg p-2">
              <div className="text-muted-foreground mb-1">{String(key)}:</div>
              <div className="font-medium">
                {(() => {
                  const responseValue = (responseData as any)?.value;
                  if (responseValue) {
                    return responseValue.length > 50 ? `${responseValue.substring(0, 50)}...` : responseValue;
                  }
                  if (typeof value === 'string') {
                    return value.length > 50 ? `${value.substring(0, 50)}...` : value;
                  }
                  return JSON.stringify(value) || 'N/A';
                })()}
              </div>
            </div>
          );
        })}
        {Object.keys(user.userData || {}).length > 1 && (
          <div className="text-xs text-muted-foreground">
            +{Object.keys(user.userData || {}).length - 1} еще...
          </div>
        )}
      </div>
    </div>
  );
}
