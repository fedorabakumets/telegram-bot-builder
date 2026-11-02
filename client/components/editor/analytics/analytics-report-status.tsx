/** @fileoverview Свежесть снимка, точные границы и доступность живых обновлений. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
/** Свойства полосы состояния. */
interface Props {
  /** Последний снимок выбранного периода. */ snapshot?: AnalyticsV2Snapshot;
  /** Выполняется запрос. */ fetching: boolean;
  /** Состояние общего соединения. */ connection: string;
  /** Доступность доставки уведомлений. */ bridgeConnected: boolean | null;
}
/**
 * Показывает свежесть и соединение; подробности полноты данных доступны в свёрнутой справке.
 * @param props - Снимок, состояние загрузки и доставки обновлений.
 * @returns Статус свежести и покрытия истории.
 */
export function AnalyticsReportStatus({ snapshot, fetching, connection, bridgeConnected }: Props) {
  const format = (date: string) => new Date(date).toLocaleString('ru-RU', { timeZone: snapshot?.range.timezone, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const connected = connection === 'connected' && bridgeConnected === true;
  return <div className="space-y-2 text-sm text-muted-foreground">
    <div className="flex flex-wrap justify-between gap-2"><p>{snapshot ? `${format(snapshot.range.from)} — ${format(snapshot.range.to)} · ${snapshot.range.timezone}` : 'Период применяется ко всем отчётам ниже'}</p>
      <p role="status" aria-live="polite">{fetching ? 'Обновляем данные…' : snapshot ? `Снимок ${format(snapshot.as_of)}` : 'Ожидаем данные'}</p></div>
    <p className="text-xs">{connected ? 'Живые обновления подключены' : connection === 'connecting' || (connection === 'connected' && bridgeConnected === null) ? 'Подключаем живые обновления…' : 'Живые обновления временно недоступны. Доступна кнопка «Обновить».'}</p>
    {snapshot && snapshot.coverage.status !== 'complete' && <details className="text-xs"><summary className="cursor-pointer py-1">О полноте данных</summary><div className="analytics-report-coverage mt-2 space-y-2"><p>{snapshot.coverage.description}</p>
      {snapshot.coverage.legacy_unknown_users > 0 && <p>Точная дата первого использования неизвестна у {snapshot.coverage.legacy_unknown_users.toLocaleString('ru-RU')} человек. Первые сохранённые направленные действия, если они есть, показаны отдельно как восстановленная история.</p>}
      <details className="mt-2"><summary className="cursor-pointer">Покрытие истории по ботам</summary><ul className="space-y-1 mt-2">{snapshot.coverage.bots.map(bot => <li key={bot.token_id}>Бот {bot.token_id}: {bot.from ? `с ${format(bot.from)}` : 'история новой методики ещё не поступала'}</li>)}</ul></details>
    </div></details>}
  </div>;
}
