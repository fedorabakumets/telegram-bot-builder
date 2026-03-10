/**
 * @fileoverview Компонент кнопок сообщения
 * Отображает кнопки бота
 */

/**
 * Свойства кнопок
 */
interface MessageButtonsProps {
  /** Массив кнопок */
  buttons: Array<{
    /** Текст кнопки */
    text?: string;
  }>;
  /** Индекс сообщения для testid */
  index: number;
}

/**
 * Компонент кнопок бота
 */
export function MessageButtons({ buttons, index }: MessageButtonsProps) {
  // Строгая проверка: buttons должен быть массивом
  if (!Array.isArray(buttons) || buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {buttons.map((button, btnIndex) => (
        <div
          key={btnIndex}
          className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
          data-testid={`dialog-button-preview-${index}-${btnIndex}`}
        >
          {String(button?.text ?? '')}
        </div>
      ))}
    </div>
  );
}
