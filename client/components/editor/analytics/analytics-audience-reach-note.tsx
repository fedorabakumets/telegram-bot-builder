/**
 * @fileoverview Подпись к «Всего пользователей»: блокировки, удалённые и рассылка
 * @module client/components/editor/analytics/analytics-audience-reach-note
 */

/**
 * Пропсы подписи о недоступных для рассылки пользователях
 */
interface AnalyticsAudienceReachNoteProps {
  /** Сколько заблокировали бота */
  blockedBotUsers?: number;
  /** Сколько с удалённым аккаунтом */
  deletedUsers?: number;
}

/**
 * Короткая подпись: счётчики и что они не попадают в рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент или null, если счётчики нулевые/не заданы
 */
export function AnalyticsAudienceReachNote({
  blockedBotUsers = 0,
  deletedUsers = 0,
}: AnalyticsAudienceReachNoteProps) {
  if (blockedBotUsers <= 0 && deletedUsers <= 0) {
    return (
      <p className="text-[11px] leading-snug text-muted-foreground">
        Заблокировавшие и удалённые аккаунты в рассылки не попадают
      </p>
    );
  }

  return (
    <div className="space-y-0.5 text-[11px] leading-snug text-muted-foreground">
      <p>
        <span className="text-amber-600 dark:text-amber-400 tabular-nums">
          Заблокировали: {blockedBotUsers}
        </span>
        {' · '}
        <span className="text-orange-600 dark:text-orange-400 tabular-nums">
          Аккаунт удалён: {deletedUsers}
        </span>
      </p>
      <p>В рассылки не входят</p>
    </div>
  );
}
