/**
 * @fileoverview Компонент отображения дат пользователя
 * @description Показывает даты регистрации, обновления и активности
 */

import { Label } from '@/components/ui/label';
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
      <Label className="text-sm font-medium">Даты</Label>
      <div className="mt-2 space-y-2">
        <div>
          <span className="text-sm text-muted-foreground">Регистрация:</span>{' '}
          {String(formatDate(createdAt ?? null))}
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Последнее обновление:</span>{' '}
          {String(formatDate(updatedAt ?? null))}
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Последняя активность:</span>{' '}
          {String(formatDate(lastInteraction ?? null))}
        </div>
      </div>
    </div>
  );
}
