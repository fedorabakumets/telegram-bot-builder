/**
 * @fileoverview Компонент отображения JSON данных пользователя
 * @description Показывает все данные пользователя в формате JSON
 */

import { useId } from 'react';
import { Textarea } from '@/components/ui/textarea';

/**
 * Пропсы компонента UserJsonData
 */
interface UserJsonDataProps {
  /** Данные пользователя */
  userData: unknown | null;
}

/**
 * Компонент JSON данных
 * @param props - Пропсы компонента
 * @returns JSX компонент JSON
 */
export function UserJsonData({ userData }: UserJsonDataProps): React.JSX.Element {
  const id = useId();
  return (
    <details className="rounded-lg border border-border/60 p-4">
      <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Исходные данные</summary>
      <label htmlFor={id} className="sr-only">Данные пользователя в формате JSON</label>
      <div className="mt-2">
        <Textarea
          id={id}
          value={JSON.stringify(userData ?? {}, null, 2)}
          readOnly
          rows={6}
          className="text-xs font-mono bg-muted/30"
          placeholder="Нет данных для отображения"
        />
      </div>
    </details>
  );
}
