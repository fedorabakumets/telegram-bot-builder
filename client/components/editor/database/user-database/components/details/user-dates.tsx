/**
 * @fileoverview Компонент отображения дат пользователя
 * @description Показывает даты регистрации, обновления и активности
 */

import { formatDate } from '../../../utils';

/**
 * Пропсы компонента UserDates
 */
interface UserDatesProps {
  /** Дата создания */
  createdAt: unknown;
  /** Дата обновления */
  updatedAt: unknown;
  /** Дата последней активности */
  lastInteraction: unknown;
}

/**
 * Компонент дат пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент дат
 */
export function UserDates({
  createdAt,
  updatedAt,
  lastInteraction,
}: UserDatesProps): React.JSX.Element {
  return (
    <div>
      <h3 className="text-sm font-medium">Даты</h3>
      <div className="mt-3 space-y-2 break-words text-sm tabular-nums">
        <div>
          <span className="text-sm text-muted-foreground">Регистрация:</span>{' '}
          {String(formatDate(createdAt ?? null))}
        </div>
        {updatedAt != null && <div>
          <span className="text-sm text-muted-foreground">Последнее обновление:</span>{' '}
          {String(formatDate(updatedAt))}
        </div>}
        <div>
          <span className="text-sm text-muted-foreground">Последняя активность:</span>{' '}
          {String(formatDate(lastInteraction ?? null))}
        </div>
      </div>
    </div>
  );
}
