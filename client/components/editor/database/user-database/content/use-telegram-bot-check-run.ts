/** @fileoverview Восстановление активной серверной проверки ботов без нового запуска. */
import { useQuery } from '@tanstack/react-query';
import type { TelegramBotCheckResult } from '@shared/telegram-bot-check';
import { apiRequest } from '@/queryClient';
/** Безопасная карточка активной проверки выбранной области. */
export interface TelegramBotCheckRun {
  /** Номер сохранённой проверки. */ id: number;
  /** Область запуска: конкретный бот либо весь проект. */ scopeTokenId?: number | null;
  /** Состояние выполнения. */ status: 'running' | 'completed' | 'failed';
  /** Время фактического старта. */ startedAt: string;
  /** Время завершения. */ finishedAt: string | null;
  /** Причина прерывания без секретов. */ failureReason: string | null;
  /** Число ботов. */ total: number;
  /** Сохранённые результаты. */ result: TelegramBotCheckResult;
}
/** Читает снимок при загрузке и обновляет активную проверку после потери потока. @param projectId - Проект. @param tokenId - Один бот либо все. @returns Сохранённая проверка и состояние загрузки. */
export function useTelegramBotCheckRun(projectId: number, tokenId: number | null) {
  return useQuery<{ /** Активная проверка выбранной области. */ run: TelegramBotCheckRun | null }>({
    queryKey: ['telegram-bot-check-run', projectId, tokenId],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/telegram-bot-checks/active${tokenId == null ? '' : `?tokenId=${tokenId}`}`),
    enabled: projectId > 0, staleTime: 0,
    refetchInterval: query => query.state.data?.run?.status === 'running' ? 1000 : false,
  });
}
