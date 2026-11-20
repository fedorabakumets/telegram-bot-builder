/** @fileoverview Общий прогресс проверки всех ботов с результатами отдельных очередей. */
import type { BotToken } from '@shared/schema';
import type { ChatAccessBatch } from '@shared/chat-access-batch';
import { isActiveChatAccessCheckStatus } from '@shared/project-sync/project-event';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
/** Показывает сумму проверок чатов, сохраняя разные связи одного человека с ботами. @param props - Группа, подписи ботов и отмена. @returns Компактный прогресс. */
export function AnalyticsAccessBatchProgress({ batch, tokens, onCancel, cancelling }: {
  /** Сохранённая серверная группа. */ batch: ChatAccessBatch;
  /** Имена доступных ботов проекта. */ tokens: BotToken[];
  /** Останавливает все очереди группы. */ onCancel: () => void;
  /** Запрос отмены отправляется. */ cancelling: boolean;
}) {
  const active = isActiveChatAccessCheckStatus(batch.status);
  const finished = batch.jobs.filter(job => !isActiveChatAccessCheckStatus(job.status)).length;
  const failed = batch.jobs.filter(job => job.status === 'failed');
  const total = batch.jobs.reduce((sum, job) => sum + job.totalCount, 0);
  const checked = batch.jobs.reduce((sum, job) => sum + job.processedCount, 0);
  /** Подпись не раскрывает секретов токенов. */
  const name = (id: number) => { const token = tokens.find(bot => bot.id === id); return token?.botUsername ? `@${token.botUsername}` : token?.name || `Бот #${id}`; };
  return <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-sm">
    <div className="flex items-center justify-between gap-3"><p role="status">{active ? 'Проверка всех ботов' : batch.status === 'cancelled' ? 'Проверка остановлена' : batch.status === 'failed' ? 'Проверка прервана' : 'Проверка завершена'}</p>
      {active && <Button size="sm" variant="ghost" disabled={cancelling || batch.status === 'cancelling'} onClick={onCancel}>Остановить все</Button>}</div>
    <p className="text-xs text-muted-foreground">Ботов: {finished} из {batch.jobs.length}. Личных чатов: {checked.toLocaleString('ru-RU')} из {total.toLocaleString('ru-RU')}. Один человек в разных ботах проверяется отдельно.</p>
    <Progress value={total ? Math.min(100, checked / total * 100) : finished / Math.max(1, batch.jobs.length) * 100} />
    <details><summary className="cursor-pointer text-xs text-muted-foreground">Результаты по ботам</summary><ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
      {batch.jobs.map(job => <li key={job.jobId} className="flex justify-between gap-4"><span>{name(job.tokenId)}</span><span className="shrink-0 tabular-nums">{job.processedCount}/{job.totalCount} · {job.status === 'failed' ? 'Не удалось завершить' : job.status === 'cancelled' ? 'Остановлено' : job.status === 'pending' ? 'Запускается' : job.status === 'completed' ? 'Завершено' : 'Проверяется'}</span></li>)}
    </ul></details>
    {!!failed.length && <p className="text-xs text-amber-500">Не удалось завершить: {failed.map(job => name(job.tokenId)).join(', ')}. Проверьте состояние ботов и повторите проверку.</p>}
  </div>;
}
