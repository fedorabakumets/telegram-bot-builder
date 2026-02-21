/**
 * @fileoverview Компонент заголовка прав администратора
 * 
 * Отображает заголовок блока прав с иконкой,
 * названием и счётчиком количества кнопок.
 */

/**
 * Интерфейс свойств компонента AdminRightsHeader
 *
 * @interface AdminRightsHeaderProps
 * @property {number} totalRights - Общее количество прав
 */
interface AdminRightsHeaderProps {
  totalRights: number;
}

/**
 * Компонент заголовка прав администратора
 *
 * @component
 * @description Отображает заголовок блока прав
 *
 * @param {AdminRightsHeaderProps} props - Свойства компонента
 * @param {number} props.totalRights - Общее количество прав
 *
 * @returns {JSX.Element} Компонент заголовка
 */
export function AdminRightsHeader({ totalRights }: AdminRightsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center">
          <i className="fas fa-user-shield text-violet-600 dark:text-violet-400 text-sm"></i>
        </div>
        <div className="text-sm font-semibold text-violet-800 dark:text-violet-200">
          Права администратора
        </div>
      </div>
      <div className="text-xs text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-1 rounded-full font-medium">
        {totalRights} кнопок
      </div>
    </div>
  );
}
