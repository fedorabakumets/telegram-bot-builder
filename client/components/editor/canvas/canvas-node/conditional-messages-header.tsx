/**
 * @fileoverview Компонент заголовка условных сообщений
 * 
 * Отображает заголовок блока условных сообщений с иконкой
 * и счётчиком количества условий.
 */

/**
 * Интерфейс свойств компонента ConditionalMessagesHeader
 *
 * @interface ConditionalMessagesHeaderProps
 * @property {number} count - Количество условий
 */
interface ConditionalMessagesHeaderProps {
  count: number;
}

/**
 * Получение правильного склонения слова "условие"
 */
function getConditionWordForm(count: number): string {
  if (count === 1) return 'е';
  if (count < 5) return 'я';
  return 'й';
}

/**
 * Компонент заголовка условных сообщений
 *
 * @component
 * @description Отображает заголовок блока условий
 *
 * @param {ConditionalMessagesHeaderProps} props - Свойства компонента
 * @param {number} props.count - Количество условий
 *
 * @returns {JSX.Element} Компонент заголовка
 */
export function ConditionalMessagesHeader({ count }: ConditionalMessagesHeaderProps) {
  const wordForm = getConditionWordForm(count);

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center">
          <i className="fas fa-code-branch text-purple-600 dark:text-purple-400 text-sm"></i>
        </div>
        <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
          Условные сообщения
        </div>
      </div>
      <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full font-medium">
        {count} услови{wordForm}
      </div>
    </div>
  );
}
