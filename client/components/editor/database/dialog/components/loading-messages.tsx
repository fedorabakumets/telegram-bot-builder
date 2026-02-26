/**
 * @fileoverview Компонент загрузки сообщений
 * Отображается во время загрузки
 */

import { RefreshCw } from 'lucide-react';

/**
 * Компонент загрузки
 */
export function LoadingMessages() {
  return (
    <div className="flex items-center justify-center py-8">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground text-sm">Загрузка...</span>
    </div>
  );
}
