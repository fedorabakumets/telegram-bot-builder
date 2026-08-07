/**
 * @fileoverview Хуки для проверки статуса первоначальной настройки
 * @module components/editor/setup/hooks/use-setup
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Статус настройки приложения
 */
export interface SetupStatus {
  /** Завершена ли первоначальная настройка */
  configured: boolean;
}

/**
 * Bootstrap-данные для first-run flow
 */
export interface SetupBootstrap extends SetupStatus {
  /** Доступен ли вход в /admin (ADMIN_API_KEY или dev-fallback) */
  adminEnabled: boolean;
}

/**
 * Хук для получения bootstrap статуса setup.
 * Выполняет GET-запрос на /api/setup/bootstrap.
 *
 * @returns Результат useQuery с configured и adminEnabled
 */
export function useSetupBootstrap() {
  return useQuery<SetupBootstrap>({
    queryKey: ['/api/setup/bootstrap'],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Хук для получения статуса настройки (legacy, совместимость).
 * @returns Результат useQuery с полем configured
 */
export function useSetupStatus() {
  return useQuery<SetupStatus>({
    queryKey: ['/api/setup/status'],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
