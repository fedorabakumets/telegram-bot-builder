/**
 * @fileoverview Подписанные показатели аудитории в заголовке вкладки пользователей.
 */

/** Свойства строки показателей аудитории. */
interface InlineStatsBadgesProps {
  /** Статистика пользователей выбранного проекта и бота. */
  stats: {
    /** Число пользователей. */
    totalUsers?: number;
    /** Число пользователей Telegram Premium. */
    premiumUsers?: number;
    /** Общее число сообщений. */
    totalInteractions?: number;
    /** Среднее число сообщений на пользователя. */
    avgInteractionsPerUser?: number;
  };
}

/**
 * Форматирует показатель по русским правилам записи чисел.
 * @param value - Числовое значение показателя.
 * @returns Читаемое число или обозначение отсутствующих данных.
 */
function formatValue(value?: number): string {
  return value == null ? '—' : value.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}

/**
 * Показывает показатели с постоянными текстовыми подписями.
 * @param props - Свойства строки показателей.
 * @returns Строка статистики аудитории.
 */
export function InlineStatsBadges({ stats }: InlineStatsBadgesProps): React.JSX.Element {
  /** Порядок показателей сохраняет привычную последовательность статистики. */
  const metrics = [
    ['Пользователей', stats.totalUsers],
    ['Premium', stats.premiumUsers],
    ['Сообщений', stats.totalInteractions],
    ['На пользователя', stats.avgInteractionsPerUser],
  ] as const;

  return (
    <dl className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 py-2 text-xs text-muted-foreground">
      {metrics.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt>{label}</dt>
          <dd className="tabular-nums font-medium text-foreground">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
