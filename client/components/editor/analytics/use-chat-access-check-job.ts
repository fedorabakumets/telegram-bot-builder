/**
 * @fileoverview Загрузка, запуск и отмена массовой проверки доступов.
 * @module client/components/editor/analytics/use-chat-access-check-job
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isActiveChatAccessCheckStatus, type ChatAccessCheckJobView } from '@shared/project-sync/project-event';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Ключ кэша задачи выбранного бота.
 * @param projectId - Проект
 * @param tokenId - Токен
 * @returns Ключ react-query
 */
export function chatAccessCheckQueryKey(projectId: number, tokenId: number | null) {
  return ['chat-access-check', projectId, tokenId] as const;
}

/**
 * Управляет задачей проверки: GET для восстановления, POST start/cancel.
 * @param projectId - Проект
 * @param tokenId - Выбранный бот
 * @returns Задача и действия
 */
export function useChatAccessCheckJob(projectId: number, tokenId: number | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = chatAccessCheckQueryKey(projectId, tokenId);

  const query = useQuery<ChatAccessCheckJobView | null>({
    queryKey,
    enabled: tokenId != null,
    queryFn: async () => {
      const data = await apiRequest('GET', `/api/projects/${projectId}/chat-access-checks/active?tokenId=${tokenId}`);
      return data.job ?? null;
    },
    refetchInterval: (current) => (
      current.state.data && isActiveChatAccessCheckStatus(current.state.data.status) ? 2000 : false
    ),
  });

  const start = useMutation({
    mutationFn: async () => apiRequest('POST', `/api/projects/${projectId}/chat-access-checks`, { tokenId }),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data.job ?? null),
    onError: (error: Error) => {
      toast({ title: 'Не удалось запустить проверку', description: error.message, variant: 'destructive' });
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const cancel = useMutation({
    mutationFn: async (jobId: number) => apiRequest('POST', `/api/projects/${projectId}/chat-access-checks/${jobId}/cancel`),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data.job ?? null),
    onError: (error: Error) => {
      toast({ title: 'Не удалось остановить проверку', description: error.message, variant: 'destructive' });
    },
  });

  return {
    job: query.data ?? null,
    start: () => start.mutate(),
    cancel: (jobId: number) => cancel.mutate(jobId),
    isStarting: start.isPending,
    isCancelling: cancel.isPending,
  };
}
