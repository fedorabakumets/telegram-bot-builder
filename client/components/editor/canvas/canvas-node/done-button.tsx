/**
 * @fileoverview Компонент кнопки завершения для мульти-выбора
 * 
 * Отображает кнопку "Готово" для подтверждения выбора
 * в режиме множественного выбора.
 */

/**
 * Интерфейс свойств компонента DoneButton
 *
 * @interface DoneButtonProps
 */
interface DoneButtonProps {
  // Резерв для будущих свойств
}

/**
 * Компонент кнопки завершения
 *
 * @component
 * @description Отображает кнопку "Готово"
 *
 * @param {DoneButtonProps} props - Свойства компонента
 *
 * @returns {JSX.Element} Компонент кнопки завершения
 */
export function DoneButton({}: DoneButtonProps) {
  return (
    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-center justify-center space-x-1">
          <i className="fas fa-check text-blue-600 dark:text-blue-400 text-xs"></i>
          <span>Готово</span>
        </div>
      </div>
    </div>
  );
}
