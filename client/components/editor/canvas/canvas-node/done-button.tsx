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
 * @property {any} button - Объект кнопки завершения
 */
interface DoneButtonProps {
  /** Кнопка завершения */
  button: any;
}

/**
 * Компонент кнопки завершения
 *
 * @component
 * @description Отображает кнопку "Готово"
 *
 * @param {DoneButtonProps} props - Свойства компонента
 * @param {any} props.button - Объект кнопки
 *
 * @returns {JSX.Element} Компонент кнопки завершения
 */
export function DoneButton({ button }: DoneButtonProps) {
  return (
    <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200 shadow-sm">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-center space-x-1">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">{button.text}</span>
          <i className="fas fa-flag-checkered text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Завершение"></i>
        </div>
      </div>
    </div>
  );
}
