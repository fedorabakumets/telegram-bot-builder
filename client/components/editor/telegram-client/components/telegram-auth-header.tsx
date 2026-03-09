/**
 * @fileoverview Компонент заголовка диалога авторизации
 *
 * @module TelegramAuthHeader
 */

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield } from 'lucide-react';

/**
 * Заголовок диалога авторизации
 *
 * @returns {JSX.Element} Заголовок с описанием
 *
 * @example
 * ```tsx
 * <TelegramAuthHeader />
 * ```
 */
export function TelegramAuthHeader() {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        Авторизация Telegram Client API
      </DialogTitle>
      <DialogDescription>
        Используйте личный аккаунт Telegram для расширенных возможностей бота
      </DialogDescription>
    </DialogHeader>
  );
}
