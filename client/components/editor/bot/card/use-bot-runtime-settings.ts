/** @fileoverview Загрузка и сохранение режима работы обработчика бота. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Режим жизни обработчика бота. */
export type BotRuntimeMode = 'direct' | 'ondemand' | 'process';

/** Сохраняемый выбор способа настройки режима сна. */
export type BotRuntimeModeChoice = Exclude<BotRuntimeMode, 'ondemand'> | 'inherit';

/** Сохранённая настройка и источник её значения. */
export interface BotRuntimeSettings {
  /** Эффективный режим следующего запуска. */
  mode: BotRuntimeMode;
  /** Источник настройки. */
  source: 'bot' | 'project' | 'server' | 'default';
  /** Включено ли наследование для режима сна. */
  inheritSleepMode?: boolean;
  /** Настроенный режим сна проекта; пустое значение использует настройку сервера. */
  projectSleepMode?: 'direct' | 'process' | null;
  /** Способ получения обновлений. */
  launchMode: 'polling' | 'webhook';
  /** Требуется ли перезапуск для применения. */
  requiresRestart: boolean;
}

/**
 * Обращается к API настройки, сохраняя ошибку сервера для показа в форме.
 * @param url - Адрес настройки.
 * @param mode - Новый режим; отсутствие означает чтение.
 * @returns Настройка, подтверждённая сервером.
 */
async function requestSettings(url: string, mode?: BotRuntimeModeChoice): Promise<BotRuntimeSettings> {
  const response = await fetch(url, mode ? {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }),
  } : undefined);
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || 'Не удалось загрузить или сохранить режим работы');
  return data;
}

/**
 * Подключает единственный серверный источник настройки и обновляет кэш после записи.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор токена.
 * @returns Чтение настройки и мутация записи.
 */
export function useBotRuntimeSettings(projectId: number, tokenId: number) {
  const url = `/api/projects/${projectId}/tokens/${tokenId}/runtime-settings`;
  const queryClient = useQueryClient();
  const query = useQuery<BotRuntimeSettings>({ queryKey: [url], queryFn: () => requestSettings(url) });
  const mutation = useMutation({
    mutationFn: (mode: BotRuntimeModeChoice) => requestSettings(url, mode),
    onSuccess: (data) => {
      queryClient.setQueryData([url], data);
      void queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] });
      void queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/launch-default`] });
    },
  });
  return { query, mutation };
}
