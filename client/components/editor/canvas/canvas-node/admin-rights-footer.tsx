/**
 * @fileoverview Компонент дополнительной информации о правах администратора
 * 
 * Отображает нижний блок с информацией о возможностях:
 * интерактивные переключатели и обновление в реальном времени.
 */

/**
 * Интерфейс свойств компонента AdminRightsFooter
 *
 * @interface AdminRightsFooterProps
 */
interface AdminRightsFooterProps {
  // Резерв для будущих свойств
}

/**
 * Компонент футера прав администратора
 *
 * @component
 * @description Отображает дополнительную информацию о правах
 *
 * @param {AdminRightsFooterProps} props - Свойства компонента
 *
 * @returns {JSX.Element} Компонент футера
 */
export function AdminRightsFooter({}: AdminRightsFooterProps) {
  return (
    <div className="mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-700/30">
      <div className="flex items-center justify-center space-x-3 text-xs text-violet-600 dark:text-violet-400">
        <div className="flex items-center space-x-1">
          <i className="fas fa-toggle-on"></i>
          <span>Интерактивные переключатели</span>
        </div>
        <div className="flex items-center space-x-1">
          <i className="fas fa-sync-alt"></i>
          <span>Обновление в реальном времени</span>
        </div>
      </div>
    </div>
  );
}
