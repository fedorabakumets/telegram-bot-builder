/**
 * @fileoverview Сетка счётчиков прогресса рассылки
 * @module client/components/editor/broadcast/components/broadcast-progress-counters
 */

/**
 * Пропсы сетки счётчиков
 */
interface BroadcastProgressCountersProps {
  /** Доставлено */
  deliveredCount: number;
  /** Заблокировали бота */
  blockedCount: number;
  /** Аккаунт удалён */
  deletedCount: number;
  /** Прочие ошибки */
  failedCount: number;
  /** Осталось обработать (опционально) */
  remaining?: number;
}

/**
 * Счётчики прогресса: доставлено, заблокировали, удалённые, прочие ошибки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BroadcastProgressCounters({
  deliveredCount,
  blockedCount,
  deletedCount,
  failedCount,
  remaining,
}: BroadcastProgressCountersProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
      <div className="border rounded p-2">
        <div className="text-lg font-bold text-green-600">{deliveredCount}</div>
        <div className="text-xs text-muted-foreground">Доставлено</div>
      </div>
      <div className="border rounded p-2">
        <div className="text-lg font-bold text-amber-600">{blockedCount}</div>
        <div className="text-xs text-muted-foreground">Заблокировали</div>
      </div>
      <div className="border rounded p-2">
        <div className="text-lg font-bold text-orange-600">{deletedCount}</div>
        <div className="text-xs text-muted-foreground">Аккаунт удалён</div>
      </div>
      <div className="border rounded p-2">
        <div className="text-lg font-bold text-red-500">{failedCount}</div>
        <div className="text-xs text-muted-foreground">Прочие ошибки</div>
      </div>
      {remaining !== undefined && (
        <div className="border rounded p-2 col-span-2 sm:col-span-4">
          <div className="text-lg font-bold">{remaining}</div>
          <div className="text-xs text-muted-foreground">Осталось</div>
        </div>
      )}
    </div>
  );
}
