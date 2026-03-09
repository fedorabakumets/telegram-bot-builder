/**
 * @fileoverview Определение узла авторизации Client API
 *
 * Узел для авторизации через Telegram Client API (Telethon).
 * Использует сессию из таблицы user_telegram_settings.
 *
 * @module editor/canvas/canvas-node/client-auth-node
 */

import { ComponentDefinition } from '@shared/schema';

/**
 * Определение компонента авторизации Client API
 */
export const clientAuthNode: ComponentDefinition = {
  id: 'client-auth',
  name: 'Client API Авторизация',
  description: 'Использует сессию из БД (user_telegram_settings)',
  icon: 'fas fa-user-shield',
  color: 'bg-emerald-100 text-emerald-600',
  type: 'client_auth',
  defaultData: {
    sessionName: 'user_session',
    sessionCreated: false
  }
};
