/**
 * @fileoverview Компонент заголовка карточки Telegram Client API
 *
 * Отображает заголовок и описание панели конфигурации.
 *
 * @module ClientApiCardHeader
 */

import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';

/**
 * Заголовок карточки конфигурации Client API
 *
 * @returns {JSX.Element} Заголовок карточки
 *
 * @example
 * ```tsx
 * <ClientApiCardHeader />
 * ```
 */
export function ClientApiCardHeader() {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-purple-600" />
        <CardTitle className="text-lg">Telegram Client API (Userbot)</CardTitle>
      </div>
      <CardDescription>
        Используйте личный аккаунт Telegram для расширенных возможностей
      </CardDescription>
    </CardHeader>
  );
}
