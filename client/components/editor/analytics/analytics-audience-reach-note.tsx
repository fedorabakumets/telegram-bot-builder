/**
 * @fileoverview Подпись к «Всего пользователей»: доступны, блокировки, удалённые
 * @module client/components/editor/analytics/analytics-audience-reach-note
 */

/**
 * Пропсы подписи о доступности аудитории для рассылки
 */
interface AnalyticsAudienceReachNoteProps {
  /** Всего пользователей в карточке */
  totalUsers?: number;
  /** Сколько заблокировали бота */
  blockedBotUsers?: number;
  /** Сколько с удалённым аккаунтом */
  deletedUsers?: number;
}

/**
 * Короткая подпись: доступны, недоступные и что они не попадают в рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент или null, если пользователей нет
 */
export function AnalyticsAudienceReachNote({
  totalUsers = 0,
  blockedBotUsers = 0,
  deletedUsers = 0,
}: AnalyticsAudienceReachNoteProps) {
  const unavailable = blockedBotUsers + deletedUsers;
  const available = Math.max(0, totalUsers - unavailable);
  if (totalUsers <= 0 && unavailable <= 0) return null;

  const parts: { className: string; label: string; value: number }[] = [];
  if (available > 0) {
    parts.push({ className: 'text-emerald-600 dark:text-emerald-400', label: 'Доступны', value: available });
  }
  if (blockedBotUsers > 0) {
    parts.push({ className: 'text-amber-600 dark:text-amber-400', label: 'Заблокировали', value: blockedBotUsers });
  }
  if (deletedUsers > 0) {
    parts.push({ className: 'text-orange-600 dark:text-orange-400', label: 'Аккаунт удалён', value: deletedUsers });
  }
  if (parts.length === 0) return null;

  return (
    <div className="space-y-0.5 text-[11px] leading-snug text-muted-foreground">
      <p>
        {parts.map((part, index) => (
          <span key={part.label}>
            {index > 0 && ' · '}
            <span className={`${part.className} tabular-nums`}>
              {part.label}: {part.value}
            </span>
          </span>
        ))}
      </p>
      {unavailable > 0 && <p>В рассылки не входят</p>}
    </div>
  );
}
