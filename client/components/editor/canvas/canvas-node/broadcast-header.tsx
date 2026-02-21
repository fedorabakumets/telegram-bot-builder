/**
 * @fileoverview Компонент заголовка узла рассылки
 * 
 * Отображает заголовок для узла broadcast (рассылка)
 * с иконкой и названием.
 */

/**
 * Интерфейс свойств компонента BroadcastHeader
 *
 * @interface BroadcastHeaderProps
 */
interface BroadcastHeaderProps {
  // Резерв для будущих свойств
}

/**
 * Компонент заголовка рассылки
 *
 * @component
 * @description Отображает заголовок для узла рассылки
 *
 * @param {BroadcastHeaderProps} props - Свойства компонента
 *
 * @returns {JSX.Element} Компонент заголовка рассылки
 */
export function BroadcastHeader({}: BroadcastHeaderProps) {
  return (
    <span className="inline-flex items-center">
      <span className="text-purple-600 dark:text-purple-400 font-mono text-sm bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 mr-2">
        📢 Рассылка
      </span>
    </span>
  );
}
