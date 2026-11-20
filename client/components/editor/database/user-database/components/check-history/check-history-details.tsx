/** @fileoverview Сохранённые времена и результаты прошлой проверки без запуска новой проверки. */
import type { CheckHistoryDetail } from '@shared/check-history';
import { statusAppearance } from '@shared/status-appearance';
import { HISTORY_STATUS_LABELS, historyTime, historyDuration } from './check-history-list';
/** Понятные причины остановки и ошибок; неизвестные машинные значения не показываются. */
const reasons: Record<string, string> = {
  server_interrupted: 'Сервер перезапущен до завершения проверки', worker_interrupted: 'Проверка прервана после потери соединения с сервером',
  user_cancelled: 'Проверка отменена пользователем', partial_failure: 'Часть ботов не удалось проверить', bot_unavailable: 'Бот недоступен', internal_error: 'Проверка прервана из-за ошибки сервера',
  server_restarted: 'Сервер перезапущен до завершения проверки', storage_error: 'Не удалось сохранить результаты', worker_error: 'Проверка прервана из-за ошибки',
  worker_failed: 'Ошибка выполнения проверки',
  bot_removed: 'Бот удалён из проекта',
  cancelled: 'Проверка отменена', cancelled_by_user: 'Проверка отменена пользователем',
  telegram_unauthorized: 'Недействительный токен', queue_error: 'Ошибка очереди проверки',
  unauthorized: 'Недействительный токен', telegram_frozen: 'Бот заморожен Telegram', bot_deactivated: 'Бот заблокирован Telegram',
  timeout: 'Telegram не ответил вовремя', network: 'Не удалось соединиться с Telegram', rate_limited: 'Telegram ограничил частоту запросов',
  token_changed: 'Токен изменился во время проверки', telegram_error: 'Telegram вернул ошибку', invalid_response: 'Некорректный ответ Telegram',
  no_test_chat: 'Нет чата для проверки', chat_unavailable: 'Проверочный чат недоступен', error: 'Не удалось проверить',
};
/** Отображает сохранённые сведения с общей палитрой статусов. @param props - Подробности. @returns Карточка запуска. */
export function CheckHistoryDetails({ data }: { /** Подробности выбранного запуска. */ data: CheckHistoryDetail }) {
  const { run, details } = data;
  /** Одинаковые подписи используют ту же палитру, что таблица и результаты новой проверки. */
  const metrics: Array<[string, number]> = run.kind === 'private-chats'
    ? [['Активные', run.summary.available], ['Пользователь заблокировал бота', run.summary.blocked], ['Аккаунт удалён', run.summary.deleted], ['Не удалось проверить', run.summary.errors]]
    : [['Проверка пройдена', run.summary.available], ['Заморожены Telegram', run.summary.frozen], ['Недействительный токен', run.summary.invalidToken], ['Другие блокировки Telegram', run.summary.otherUnavailable], ['Не удалось проверить', run.summary.errors]];
  return <div className="space-y-3 text-sm">
    <dl className="grid grid-cols-2 gap-3">{[['Создана', run.createdAt], ['Начало', run.startedAt], ['Завершение', run.finishedAt]].map(([label, time]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd>{historyTime(time)}</dd></div>)}
      <div><dt className="text-xs text-muted-foreground">Состояние</dt><dd>{HISTORY_STATUS_LABELS[run.status]}</dd></div></dl>
    <p className="text-xs text-muted-foreground">Длительность: {historyDuration(run.startedAt, run.finishedAt)}</p>
    <p className="text-xs text-muted-foreground">{run.scope.mode === 'all_bots' ? 'Все боты проекта' : `Бот #${run.scope.tokenId}`} · Проверено {run.summary.processed} из {run.summary.total}{run.kind === 'private-chats' ? ' пар бот–чат. Один человек может учитываться у нескольких ботов.' : ' ботов.'}</p>
    {run.failureReason && <p className="text-sm text-muted-foreground">{reasons[run.failureReason] || 'Проверка прервана. Сохранён частичный результат.'}</p>}
    <dl className="grid grid-cols-2 gap-3">{metrics.map(([label, value]) => <div key={label} style={{ color: statusAppearance(label).color }}><dt className="text-xs">{label}</dt><dd className="mt-1 font-medium tabular-nums">{value.toLocaleString('ru-RU')}</dd></div>)}</dl>
    <ul className="divide-y divide-border rounded-lg border border-border">{details.jobs?.map(job => {
      const bot = run.scope.bots?.find(bot => bot.tokenId === job.tokenId);
      return <li key={job.jobId} className="space-y-1 px-3 py-2"><p>{bot?.username ? `@${bot.username}` : bot?.name || `Бот #${job.tokenId}`}</p><p className="text-xs text-muted-foreground">{HISTORY_STATUS_LABELS[job.status]} · {job.processedCount} из {job.totalCount} · Ошибок: {job.errorCount}</p>{job.failureReason && <p className="text-xs text-muted-foreground">{reasons[job.failureReason] || 'Проверка бота прервана'}</p>}</li>;
    })}{details.items?.map(item => {
      const interrupted = item.finishedAt === null && run.status === 'failed';
      const label = interrupted ? 'Не проверен — проверка прервана' : item.status === 'available' ? 'Проверка пройдена' : reasons[item.reason || 'error'] || 'Не удалось проверить';
      return <li key={item.tokenId} className="space-y-1 px-3 py-2"><p>{item.username ? `@${item.username}` : item.name || `Бот #${item.tokenId}`}</p><p style={{ color: statusAppearance(item.status === 'error' ? 'Не удалось проверить' : label).color }}>{label}</p>{item.errorCode && <p className="text-xs text-muted-foreground">Код Telegram: {item.errorCode}</p>}</li>;
    })}</ul>
  </div>;
}
