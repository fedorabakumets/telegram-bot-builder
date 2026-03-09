/**
 * @fileoverview Компонент сообщения о сохранённых API credentials
 *
 * Отображает информацию об успешно сохранённых credentials.
 *
 * @module ApiCredentialsSaved
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, LogOut } from 'lucide-react';

/**
 * Пропсы компонента сохранённых credentials
 */
export interface ApiCredentialsSavedProps {
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик сброса credentials */
  onReset: () => void;
}

/**
 * Сообщение о сохранённых API credentials
 *
 * @param {ApiCredentialsSavedProps} props - Пропсы компонента
 * @returns {JSX.Element} Сообщение о сохранении
 *
 * @example
 * ```tsx
 * <ApiCredentialsSaved isLoading={false} onReset={handleReset} />
 * ```
 */
export function ApiCredentialsSaved({ isLoading, onReset }: ApiCredentialsSavedProps) {
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <Label className="text-sm font-medium text-green-800 dark:text-green-200">
            API Credentials сохранены
          </Label>
        </div>
        <Button
          onClick={onReset}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="text-xs h-8"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Сбросить
        </Button>
      </div>
      <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
        <p>• API ID и API Hash успешно сохранены в базе данных</p>
        <p>• Теперь вы можете авторизоваться через Telegram Client API</p>
        <p>• После авторизации будет доступен полный функционал</p>
      </div>
    </div>
  );
}
