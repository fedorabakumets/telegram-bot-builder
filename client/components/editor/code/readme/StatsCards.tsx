/**
 * @fileoverview Компонент карточек статистики для README
 * Отображает статистику бота в виде цветных карточек
 */

/**
 * Свойства компонента карточек статистики
 */
interface StatsCardsProps {
  /** Массив элементов статистики */
  stats: Array<{ label: string; value: number }>;
}

/** Цветовые схемы для карточек */
const COLORS = [
  { bg: 'bg-blue-50/50 dark:bg-blue-900/25', border: 'border-blue-200/50 dark:border-blue-800/50', text: 'text-blue-600 dark:text-blue-400', label: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-green-50/50 dark:bg-green-900/25', border: 'border-green-200/50 dark:border-green-800/50', text: 'text-green-600 dark:text-green-400', label: 'text-green-700 dark:text-green-300' },
  { bg: 'bg-purple-50/50 dark:bg-purple-900/25', border: 'border-purple-200/50 dark:border-purple-800/50', text: 'text-purple-600 dark:text-purple-400', label: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-orange-50/50 dark:bg-orange-900/25', border: 'border-orange-200/50 dark:border-orange-800/50', text: 'text-orange-600 dark:text-orange-400', label: 'text-orange-700 dark:text-orange-300' },
  { bg: 'bg-cyan-50/50 dark:bg-cyan-900/25', border: 'border-cyan-200/50 dark:border-cyan-800/50', text: 'text-cyan-600 dark:text-cyan-400', label: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-pink-50/50 dark:bg-pink-900/25', border: 'border-pink-200/50 dark:border-pink-800/50', text: 'text-pink-600 dark:text-pink-400', label: 'text-pink-700 dark:text-pink-300' },
];

/**
 * Компонент карточек статистики бота
 * @param props - Свойства компонента
 * @returns JSX элемент с сеткой карточек
 */
export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2 xs:gap-2.5 my-4">
      {stats.map((stat, index) => {
        const color = COLORS[index % COLORS.length];
        return (
          <div
            key={index}
            className={`${color.bg} ${color.border} border rounded-md p-2 xs:p-2.5 text-center`}
          >
            <div className={`${color.text} text-sm xs:text-base font-bold`}>{stat.value}</div>
            <div className={`${color.label} text-xs mt-0.5`}>{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
