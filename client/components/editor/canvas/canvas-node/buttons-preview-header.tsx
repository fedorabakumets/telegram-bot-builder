/**
 * @fileoverview Компонент заголовка превью кнопок
 * 
 * Отображает заголовок блока кнопок с указанием типа
 * клавиатуры и индикатором множественного выбора.
 */

/**
 * Интерфейс свойств компонента ButtonsPreviewHeader
 *
 * @interface ButtonsPreviewHeaderProps
 * @property {boolean} [isMultiSelect] - Является ли множественным выбором
 * @property {string} [keyboardType] - Тип клавиатуры (inline/reply)
 */
interface ButtonsPreviewHeaderProps {
  isMultiSelect?: boolean;
  keyboardType?: 'inline' | 'reply';
}

/**
 * Компонент заголовка превью кнопок
 *
 * @component
 * @description Отображает заголовок блока кнопок
 *
 * @param {ButtonsPreviewHeaderProps} props - Свойства компонента
 * @param {boolean} [props.isMultiSelect] - Множественный выбор
 * @param {string} [props.keyboardType] - Тип клавиатуры
 *
 * @returns {JSX.Element} Компонент заголовка
 */
export function ButtonsPreviewHeader({ isMultiSelect, keyboardType }: ButtonsPreviewHeaderProps) {
  const getKeyboardLabel = () => {
    if (isMultiSelect) return 'Множественный выбор';
    if (keyboardType === 'inline') return 'Inline кнопки';
    if (keyboardType === 'reply') return 'Reply кнопки';
    return 'Кнопки';
  };

  return (
    <div className="flex items-center space-x-2 mb-3">
      <div className="w-1 h-4 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {getKeyboardLabel()}
      </span>
      {isMultiSelect && (
        <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
          <i className="fas fa-check-double text-xs mr-1"></i>
          Мульти-выбор
        </div>
      )}
    </div>
  );
}
