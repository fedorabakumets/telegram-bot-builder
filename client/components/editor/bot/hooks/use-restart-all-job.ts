/** @fileoverview Мутация фонового перезапуска с восстановлением после обновления страницы. */
import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { invalidateBotStatusQueries } from '../invalidate-bot-status-queries';
import { runRestartAllJob, restartAllProgressKey, savedRestartJob } from '../restart-all-job';

/** Управлять перезапуском и сообщать успех только после подтверждённого результата задания. */
export function useRestartAllJob(onBotStarted?: (projectId: number, tokenId: number, botName: string) => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const restored = useRef(false);
  const mutation = useMutation({
    mutationFn: (pid: number) => runRestartAllJob(pid, job => queryClient.setQueryData(restartAllProgressKey(pid), job)),
    onSuccess: (data, pid) => {
      data.results?.filter(r => r.success).forEach(r => onBotStarted?.(pid, r.tokenId, ''));
      const failed = data.failed > 0 || !data.ok;
      toast({ title: failed ? 'Перезапуск завершён с ошибками' : 'Боты перезапущены',
        description: data.message || `Перезапущено: ${data.restarted}. Ошибок: ${data.failed}`,
        variant: failed ? 'destructive' : undefined });
    },
    onError: (error: Error) => toast({ title: 'Статус перезапуска не подтверждён', description: error.message, variant: 'destructive' }),
    onSettled: (_data, _error, pid) => {
      void queryClient.invalidateQueries({ queryKey: [`/api/projects/${pid}/tokens`] });
      invalidateBotStatusQueries(queryClient, pid);
    },
    retry: false,
  });
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = savedRestartJob();
    if (saved?.projectId && saved.jobId) mutation.mutate(saved.projectId);
  }, [mutation.mutate]);
  return mutation;
}
