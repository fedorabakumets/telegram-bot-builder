/** @fileoverview Свежесть снимка, точные границы и доступность живых обновлений. */
import type { AnalyticsV2Snapshot } from '@shared/analytics/v2';
/** Свойства полосы состояния. */
interface Props {
  /** Последний снимок выбранного периода. */ snapshot?: AnalyticsV2Snapshot;
  /** Выполняется запрос. */ fetching: boolean;
  /** Показывается снимок предыдущего периода во время загрузки. */ previousPeriod?: boolean;
  /** Состояние общего соединения. */ connection: string;
  /** Доступность доставки уведомлений. */ bridgeConnected: boolean | null;
}
/**
 * Показывает свежесть снимка и состояние живого соединения.
 * @param props - Снимок, состояние загрузки и доставки обновлений.
 * @returns Статус свежести и покрытия истории.
 */
export function AnalyticsReportStatus({ snapshot, fetching, connection, bridgeConnected, previousPeriod }: Props) {
  const format = (date: string) => new Date(date).toLocaleString('ru-RU', { timeZone: snapshot?.range.timezone, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const connected = connection === 'connected' && bridgeConnected === true;
  return <div className="analytics-report-status space-y-2 text-sm text-muted-foreground">
    <div className="flex flex-wrap justify-between gap-2"><p>{snapshot ? `${format(snapshot.range.from)} — ${format(snapshot.range.to)} · ${snapshot.range.timezone}` : 'Период применяется ко всем отчётам ниже'}</p>
      <p role="status" aria-live="polite">{previousPeriod ? 'Загружаем выбранный период — пока показан предыдущий' : snapshot ? `Снимок ${format(snapshot.as_of)}` : fetching ? 'Обновляем данные…' : 'Ожидаем данные'}</p></div>
    {!connected && <p className="text-xs">{connection === 'connecting' || (connection === 'connected' && bridgeConnected === null) ? 'Подключаем живые обновления…' : 'Живые обновления недоступны · обновите данные вручную'}</p>}
  </div>;
}
