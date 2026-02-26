/**
 * @fileoverview Компонент отображения JSON данных пользователя
 * @description Показывает все данные пользователя в формате JSON
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * Пропсы компонента UserJsonData
 */
interface UserJsonDataProps {
  /** Данные пользователя */
  userData: unknown;
}

/**
 * Компонент JSON данных
 * @param props - Пропсы компонента
 * @returns JSX компонент JSON
 */
export function UserJsonData({ userData }: UserJsonDataProps): React.JSX.Element {
  return (
    <div>
      <Label className="text-sm font-medium">Все данные пользователя (JSON)</Label>
      <div className="mt-2">
        <Textarea
          value={JSON.stringify(userData, null, 2)}
          readOnly
          rows={6}
          className="text-xs font-mono bg-muted"
          placeholder="Нет данных для отображения"
        />
      </div>
    </div>
  );
}
