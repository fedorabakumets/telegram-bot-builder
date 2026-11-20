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

/** Сохраняет HTTP-статус для решения о повторе первоначальной проверки. */
class SetupBootstrapHttpError extends Error {
  /** @param status - Код ответа bootstrap. */
  constructor(readonly status: number) {
    super(`Не удалось проверить настройку приложения (HTTP ${status})`);
  }
}

/** Отдельная ошибка отличает истечение срока ожидания от отмены запроса. */
class SetupBootstrapTimeoutError extends Error {}

/**
 * Загружает подтверждённое состояние bootstrap, включая признак доступности управления.
 * @param signal - Сигнал отмены запроса из React Query.
 * @returns Состояние настройки приложения.
 */
async function fetchSetupBootstrap(signal: AbortSignal): Promise<SetupBootstrap> {
  const controller = new AbortController();
  /** Передаёт отмену от React Query в текущую попытку. */
  const cancel = () => controller.abort();
  if (signal.aborted) cancel();
  signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => {
    controller.abort(new SetupBootstrapTimeoutError('Сервер не ответил на проверку настройки вовремя'));
  }, 10_000);
  try {
    const response = await fetch('/api/setup/bootstrap', {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new SetupBootstrapHttpError(response.status);
    const data: Partial<SetupBootstrap> | null = await response.json();
    if (typeof data?.configured !== 'boolean' || typeof data.adminEnabled !== 'boolean') {
      throw new Error('Некорректный ответ проверки настройки приложения');
    }
    return { configured: data.configured, adminEnabled: data.adminEnabled };
  } catch (error) {
    // Чтение тела ответа может вернуть обычный AbortError вместо причины отмены.
    if (controller.signal.reason instanceof SetupBootstrapTimeoutError) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}

/**
 * Разрешает два автоматических повтора при сетевом сбое или временной недоступности сервера.
 * @param failureCount - Число предыдущих повторов.
 * @param error - Причина сбоя запроса.
 * @returns Нужно ли повторить запрос.
 */
function retrySetupBootstrap(failureCount: number, error: Error): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof SetupBootstrapHttpError) return [500, 502, 503, 504].includes(error.status);
  return error instanceof TypeError || error instanceof SetupBootstrapTimeoutError;
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
    queryFn: ({ signal }) => fetchSetupBootstrap(signal),
    staleTime: 5 * 60 * 1000,
    networkMode: 'always',
    retry: retrySetupBootstrap,
    retryDelay: (attemptIndex) => 1000 * (attemptIndex + 1),
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
