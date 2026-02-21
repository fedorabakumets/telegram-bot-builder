/**
 * @fileoverview Компонент превью для узла типа "Права администратора"
 * 
 * Отображает визуальное представление прав администратора с заголовком,
 * сеткой кнопок прав и дополнительной информацией.
 */

import { AdminRightsHeader } from './admin-rights-header';
import { AdminRightsGrid } from './admin-rights-grid';
import { AdminRightsFooter } from './admin-rights-footer';

/**
 * Интерфейс свойств компонента AdminRightsPreview
 *
 * @interface AdminRightsPreviewProps
 */
interface AdminRightsPreviewProps {
  // Резерв для будущих свойств
}

const TOTAL_RIGHTS_COUNT = 11;

/**
 * Компонент превью прав администратора
 *
 * @component
 * @description Отображает превью узла с правами администратора
 *
 * @param {AdminRightsPreviewProps} props - Свойства компонента
 *
 * @returns {JSX.Element} Компонент превью прав администратора
 */
export function AdminRightsPreview({}: AdminRightsPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/25 dark:to-purple-900/25 border border-violet-200/50 dark:border-violet-800/40 rounded-xl p-4 mb-4 shadow-sm">
      <AdminRightsHeader totalRights={TOTAL_RIGHTS_COUNT} />
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-1 h-4 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Inline кнопки
          </span>
        </div>

        <AdminRightsGrid />
      </div>

      <AdminRightsFooter />
    </div>
  );
}
