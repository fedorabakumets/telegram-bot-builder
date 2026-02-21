/**
 * @fileoverview Компонент кнопки опции для мульти-выбора
 * 
 * Отображает кнопку опции в режиме множественного выбора
 * с визуальным индикатором состояния.
 */

/**
 * Интерфейс свойств компонента OptionButton
 *
 * @interface OptionButtonProps
 * @property {any} button - Объект кнопки опции
 */
interface OptionButtonProps {
  button: any;
}

/**
 * Компонент кнопки опции
 *
 * @component
 * @description Отображает кнопку опции для мульти-выбора
 *
 * @param {OptionButtonProps} props - Свойства компонента
 * @param {any} props.button - Объект кнопки
 *
 * @returns {JSX.Element} Компонент кнопки опции
 */
export function OptionButton({ button }: OptionButtonProps) {
  return (
    <div className="group relative">
      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg text-xs font-medium text-green-700 dark:text-green-300 text-center border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors duration-200 shadow-sm relative">
        <div className="flex items-center justify-center space-x-1">
          <i className="fas fa-square text-green-600 dark:text-green-400 text-xs opacity-50" title="Невыбрано"></i>
          <span className="truncate">{button.text}</span>
        </div>
        {/* Simulated selected state */}
        <div className="absolute inset-0 bg-green-500/10 dark:bg-green-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
      </div>
    </div>
  );
}
