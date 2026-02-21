/**
 * @fileoverview Компонент карточки права администратора
 * 
 * Отображает отдельное право администратора в виде карточки
 * с иконкой, названием и стрелкой перехода.
 */

/**
 * Интерфейс свойств компонента AdminRightCard
 *
 * @interface AdminRightCardProps
 * @property {string} icon - Иконка права
 * @property {string} name - Название права
 */
interface AdminRightCardProps {
  icon: string;
  name: string;
}

/**
 * Компонент карточки права администратора
 *
 * @component
 * @description Отображает карточку одного права
 *
 * @param {AdminRightCardProps} props - Свойства компонента
 * @param {string} props.icon - Иконка права (эмодзи)
 * @param {string} props.name - Название права
 *
 * @returns {JSX.Element} Компонент карточки права
 */
export function AdminRightCard({ name }: AdminRightCardProps) {
  return (
    <div className="group relative">
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200 shadow-sm">
        <div className="flex items-center justify-center space-x-1">
          <span className="truncate">{name}</span>
          <i className="fas fa-chevron-right text-blue-500 dark:text-blue-400 text-xs opacity-70"></i>
        </div>
      </div>
    </div>
  );
}
