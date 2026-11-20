/** @fileoverview Ручная проверка самих ботов Telegram с обновлением счётчиков и строк пользователей. */
import { Bot, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import type { TelegramBotCheckResult } from '@shared/telegram-bot-check';
import { useState, useEffect, useRef } from 'react';
import { UsersBotCheckResult } from './users-bot-check-result';
import { streamTelegramBotCheck } from './stream-telegram-bot-check';
import { useTelegramBotCheckRun, type TelegramBotCheckRun } from './use-telegram-bot-check-run';
/**
 * Проверяет getMe в выбранной области и перечитывает общий источник статусов.
 * @param props - Проект и выбранный бот либо все боты.
 * @returns Кнопка с блокировкой повторного запуска и итоговым уведомлением.
 */
export function UsersTelegramBotCheckButton({ projectId, tokenId, iconButtonClassName }: {
  /** Проверяемый проект. */ projectId: number;
  /** Выбранный бот; null означает всех ботов. */ tokenId: number | null;
  /** Классы компактной кнопки в карточке бота. */ iconButtonClassName?: string;
}) {
  const client = useQueryClient();
  const tokens = useProjectTokens([projectId])[0]?.tokens ?? [];
  const [result, setResult] = useState<TelegramBotCheckResult | null>(null);
  const [open, setOpen] = useState(false);
  const restored = useTelegramBotCheckRun(projectId, tokenId);
  const [runMeta, setRunMeta] = useState<TelegramBotCheckRun | null>(null);
  const [total, setTotal] = useState(0), [error, setError] = useState('');
  const startedLocallyAt = useRef(0);
  const controller = useRef<AbortController | null>(null);
  /** Результат другого проекта или выбранного бота не переносится в новую область. */
  useEffect(() => { startedLocallyAt.current = 0; setRunMeta(null); setResult(null); setOpen(false); return () => controller.current?.abort(); }, [projectId, tokenId]);
  const check = useMutation({
    onMutate: () => { startedLocallyAt.current = Date.now(); void client.invalidateQueries({ queryKey: ['telegram-bot-check-run', projectId, tokenId] }); setResult({ items: [], available: 0, unavailable: 0, errors: 0 }); setTotal(tokenId == null ? tokens.length : 1); setError(''); setOpen(true); },
    mutationFn: async (): Promise<TelegramBotCheckResult> => {
      const request = new AbortController(); controller.current = request;
      return streamTelegramBotCheck(projectId, tokenId, (result, count, meta) => {
        if (!request.signal.aborted) { setResult(result); setTotal(count);
          if (meta) setRunMeta({ id: meta.runId, scopeTokenId: tokenId, startedAt: meta.startedAt, finishedAt: meta.finishedAt, status: meta.status, failureReason: null, total: count, result });
          void client.invalidateQueries({ queryKey: ['telegram-bot-check-run', projectId, tokenId] }); }
      }, request.signal);
    },
    onSuccess: result => {
      setResult(result);
      void client.invalidateQueries({ queryKey: ['check-history', projectId] });
      void client.invalidateQueries({ queryKey: ['telegram-bot-check-run', projectId, tokenId] });
      void client.invalidateQueries({ predicate: query =>
        (query.queryKey[0] === 'infinite-users' && query.queryKey[1] === projectId)
        || (typeof query.queryKey[0] === 'string' && (query.queryKey[0] === `/api/projects/${projectId}/tokens`
          || query.queryKey[0].includes(`/projects/${projectId}/users/stats`))) });
    },
    onError: (error: Error) => { if (!controller.current?.signal.aborted) { setError(error.message); void client.invalidateQueries({ queryKey: ['telegram-bot-check-run', projectId, tokenId] }); } },
  });
  /** Снимок сервера восстанавливается после перезагрузки и при разрыве потока; чтение ничего не запускает. */
  const run = restored.data?.run;
  useEffect(() => {
    if (check.isPending || !run || Date.parse(run.startedAt) < startedLocallyAt.current
      || (runMeta?.id === run.id && runMeta.status !== 'running' && run.status === 'running')) return;
    setRunMeta(run); setResult(run.result); setTotal(run.total);
    if (run.failureReason) setError('Проверка прервана. Сохранённые результаты доступны в истории.');
  }, [run, check.isPending]);
  const pending = check.isPending || run?.status === 'running';
  const label = tokenId == null ? 'Проверить ботов в Telegram' : 'Проверить бота в Telegram';
  return <div className={iconButtonClassName ? 'contents' : 'flex flex-wrap items-center justify-end gap-2'}>
    <button type="button" className={iconButtonClassName ?? 'users-telegram-bot-check'} aria-label={label} aria-busy={pending} onClick={() => setOpen(true)}
    title="Проверить заморозку через getMyCommands и сохранение того же списка команд. Сообщения не отправляются.">
    {pending ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" /> : <Bot className="h-3.5 w-3.5" aria-hidden="true" />}
    {!iconButtonClassName && (pending ? 'Проверяем ботов…' : label)}
  </button><UsersBotCheckResult result={result} open={open} onOpenChange={setOpen} pending={pending} total={total} startedAt={runMeta?.startedAt} finishedAt={runMeta?.finishedAt} projectId={projectId} tokenId={tokenId} onStart={() => check.mutate()} startDisabled={pending || !tokens.length}
    tokens={tokens.filter(token => runMeta?.scopeTokenId === null || tokenId == null || token.id === tokenId)} error={error} /></div>;
}
