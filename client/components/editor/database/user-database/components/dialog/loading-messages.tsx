/**
 * @fileoverview Компонент загрузки сообщений
 * @description Отображается во время загрузки истории сообщений
 */

import { RefreshCw } from 'lucide-react';

/**
 * Компонент загрузки сообщений
 * @returns JSX компонент загрузки
 */
export function LoadingMessages(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center py-8">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Загрузка сообщений...</span>
    </div>
  );
}
