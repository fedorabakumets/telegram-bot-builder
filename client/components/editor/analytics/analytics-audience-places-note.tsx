/**
 * @fileoverview Строка мест, где люди писали: личные, группы и каналы.
 * @module client/components/editor/analytics/analytics-audience-places-note
 */

/**
 * Пропсы строки мест общения.
 */
interface AnalyticsAudiencePlacesNoteProps {
  /** Люди, которые хотя бы раз писали в личном чате */
  privateUsers?: number;
  /** Люди, которые хотя бы раз писали в группе или супергруппе */
  groupUsers?: number;
  /** Люди, которые хотя бы раз писали в канале */
  channelUsers?: number;
  /** Человек писал больше чем в одном виде чата */
  usersInSeveralPlaces?: number;
}

/**
 * Форма слова для фразы о людях в нескольких местах.
 * 2–4, 22–24 — «человека»; 1, 5–20, 11–14, 21, 25 — «человек».
 * @param count - Число людей
 * @returns «человек» или «человека»
 */
function overlapPeopleWord(count: number): string {
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'человека';
  return 'человек';
}

/**
 * Вторая строка под «Доступны»: сколько людей писали лично, в группах и в каналах.
 * Все три нуля скрывают строку. Нулевые личные и группы остаются, если есть хоть одно число.
 * @param props - Счётчики мест
 * @returns JSX элемент или null
 */
export function AnalyticsAudiencePlacesNote({
  privateUsers = 0,
  groupUsers = 0,
  channelUsers = 0,
  usersInSeveralPlaces = 0,
}: AnalyticsAudiencePlacesNoteProps) {
  const privateCount = Math.max(0, privateUsers);
  const groupCount = Math.max(0, groupUsers);
  const channelCount = Math.max(0, channelUsers);
  if (privateCount <= 0 && groupCount <= 0 && channelCount <= 0) return null;

  const parts: { className: string; label: string; value: number }[] = [
    { className: 'text-sky-600 dark:text-sky-400', label: 'Писали лично', value: privateCount },
    { className: 'text-indigo-600 dark:text-indigo-400', label: 'Писали в группах', value: groupCount },
  ];
  if (channelCount > 0) {
    parts.push({ className: 'text-cyan-700 dark:text-cyan-300', label: 'Писали в каналах', value: channelCount });
  }

  const overlap = Math.max(0, Math.trunc(usersInSeveralPlaces));

  return (
    <div className="space-y-0.5 text-[11px] leading-snug">
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
      {overlap > 0 && (
        <p className="text-muted-foreground">
          {overlap} {overlapPeopleWord(overlap)} писали в нескольких местах
        </p>
      )}
    </div>
  );
}
