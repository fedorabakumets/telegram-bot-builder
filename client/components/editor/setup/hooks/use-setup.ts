/**
 * @fileoverview Хуки для работы с API настройки приложения
 * @module components/editor/setup/hooks/use-setup
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/queryClient';

/**
 * Статус настройки приложения
 */
export interface SetupStatus {
  /** Завершена ли первоначальная настройка */
  configured: boolean;
}

/**
 * Данные для первоначальной настройки Telegram-интеграции
 */
export interface SetupPayload {
  /** Client ID из настроек Web Login в BotFather */
  telegramClientId: string;
  /** Client Secret из настроек Web Login в BotFather */
  telegramClientSecret: string;
  /** Имя бота без символа @ */
  telegramBotUsername: string;
  /** Токен бота для Mini App авторизации (опционально) */
  telegramBotToken?: string;
}

/**
 * Хук для получения статуса настройки приложения.
 * Выполняет GET-запрос на /api/setup/status.
 *
 * @returns Результат useQuery с полем configured
 */
export function useSetupStatus() {
  return useQuery<SetupStatus>({
    queryKey: ['/api/setup/status'],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Хук для сохранения настроек Telegram-интеграции.
 * Выполняет POST-запрос на /api/setup и инвалидирует кеш статуса.
 *
 * @returns Результат useMutation для отправки SetupPayload
 */
export function useSetupMutation() {
  return useMutation<SetupStatus, Error, SetupPayload>({
    mutationFn: (payload: SetupPayload) =>
      apiRequest('POST', '/api/setup', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/setup/status'] });
    },
  });
}
