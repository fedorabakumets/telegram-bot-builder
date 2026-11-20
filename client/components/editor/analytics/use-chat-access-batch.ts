/** @fileoverview Восстанавливаемый общий прогресс проверки всех ботов проекта. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ChatAccessBatch } from '@shared/chat-access-batch';
import { isActiveChatAccessCheckStatus } from '@shared/project-sync/project-event';
/** Читает серверную группу независимо от вкладки браузера. @param projectId - Текущий проект. @returns Прогресс, запуск и отмена. */
export function useChatAccessBatch(projectId: number) {
  const client = useQueryClient(), { toast } = useToast();
  const key = ['chat-access-batch', projectId];
  const query = useQuery<{ /** Последняя группа проекта. */ batch: ChatAccessBatch | null }>({
    queryKey: key, queryFn: () => apiRequest('GET', `/api/projects/${projectId}/chat-access-batches/active`),
    enabled: projectId > 0, staleTime: 0,
    refetchInterval: query => query.state.data?.batch && isActiveChatAccessCheckStatus(query.state.data.batch.status) ? 1000 : false,
  });
  const batch = query.data?.batch;
  const progressKey = batch ? `${batch.id}:${batch.status}:${batch.jobs.reduce((sum, job) => sum + job.processedCount, 0)}` : '';
  /** Обновляет профили и сводку даже в режиме всех ботов, где нет подписки на один токен. */
  useEffect(() => {
    if (!progressKey) return;
    const timer = setTimeout(() => { void client.invalidateQueries({ predicate: item =>
      (item.queryKey[0] === 'infinite-users' && item.queryKey[1] === projectId)
      || String(item.queryKey[0]).includes(`/projects/${projectId}/users/stats`) }); }, 700);
    return () => clearTimeout(timer);
  }, [client, projectId, progressKey]);
  /** Обновляет общий итог и видимый каталог после серверного изменения. */
  const update = (data: { /** Группа без секретов. */ batch: ChatAccessBatch | null }) => {
    client.setQueryData(key, data);
    void client.invalidateQueries({ queryKey: ['infinite-users', projectId] });
  };
  const start = useMutation({ mutationFn: () => apiRequest('POST', `/api/projects/${projectId}/chat-access-batches`, {}), onSuccess: update,
    onError: (error: Error) => toast({ title: 'Не удалось проверить всех ботов', description: error.message, variant: 'destructive' }) });
  const cancel = useMutation({ mutationFn: (id: number) => apiRequest('POST', `/api/projects/${projectId}/chat-access-batches/${id}/cancel`), onSuccess: update,
    onError: (error: Error) => toast({ title: 'Не удалось остановить проверку', description: error.message, variant: 'destructive' }) });
  return { batch: query.data?.batch ?? null, start: () => start.mutate(), cancel: (id: number) => cancel.mutate(id),
    isStarting: start.isPending, isCancelling: cancel.isPending };
}
