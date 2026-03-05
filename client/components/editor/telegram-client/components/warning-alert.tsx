/**
 * @fileoverview Компонент предупреждения о рисках блокировки
 *
 * Отображает предупреждение о возможных рисках при использовании Client API.
 *
 * @module WarningAlert
 */

import { AlertTriangle } from 'lucide-react';

/**
 * Компонент предупреждения о рисках блокировки аккаунта
 *
 * @returns {JSX.Element} Предупреждение о массовых рассылках
 *
 * @example
 * ```tsx
 * <WarningAlert />
 * ```
 */
export function WarningAlert() {
  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-medium">Внимание!</p>
          <p>Массовые рассылки могут привести к блокировке аккаунта. Используйте с осторожностью.</p>
        </div>
      </div>
    </div>
  );
}
