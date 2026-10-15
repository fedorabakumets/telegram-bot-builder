/**
 * @fileoverview Подпись к карточке «Группы»: доступны и исключили.
 * @module client/components/editor/analytics/analytics-groups-reach-note
 */

/** Пропсы подписи о доступе бота к группам. */
interface AnalyticsGroupsReachNoteProps {
  /** Сколько групп с сохранённым доступом. */
  availableGroups?: number;
  /** Сколько групп, откуда бота исключили. */
  kickedGroups?: number;
}

/**
 * Короткая строка под числом групп. Нулевые части скрыты.
 * @param props - Счётчики
 * @returns JSX или null
 */
export function AnalyticsGroupsReachNote({
  availableGroups = 0,
  kickedGroups = 0,
}: AnalyticsGroupsReachNoteProps) {
  const parts: { className: string; label: string; value: number }[] = [];
  if (availableGroups > 0) {
    parts.push({ className: 'text-emerald-600 dark:text-emerald-400', label: 'Доступны', value: availableGroups });
  }
  if (kickedGroups > 0) {
    parts.push({ className: 'text-amber-600 dark:text-amber-400', label: 'Исключили', value: kickedGroups });
  }
  if (parts.length === 0) return null;
  return (
    <p className="text-[11px] leading-snug text-muted-foreground">
      {parts.map((part, index) => (
        <span key={part.label}>
          {index > 0 && ' · '}
          <span className={`${part.className} tabular-nums`}>{part.label}: {part.value}</span>
        </span>
      ))}
    </p>
  );
}
