/**
 * @fileoverview Компонент кнопок сообщения
 * Отображает кнопки бота с поддержкой URL-ссылок
 */

/**
 * Данные одной кнопки сообщения
 */
interface MessageButton {
  /** Текст кнопки */
  text?: string;
  /** URL для кнопки-ссылки */
  url?: string;
  /** Действие кнопки */
  action?: string;
}

/**
 * Свойства компонента кнопок
 */
interface MessageButtonsProps {
  /** Массив кнопок */
  buttons: MessageButton[];
  /** Индекс сообщения для testid */
  index: number;
}

/**
 * Компонент кнопок бота.
 * Кнопки с action=url рендерятся как кликабельные ссылки,
 * остальные — как обычные пилюли.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function MessageButtons({ buttons, index }: MessageButtonsProps) {
  if (!Array.isArray(buttons) || buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {buttons.map((button, btnIndex) => {
        const isUrl = button.action === 'url' && button.url;
        const label = String(button?.text ?? '');

        if (isUrl) {
          return (
            <a
              key={btnIndex}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              data-testid={`dialog-button-preview-${index}-${btnIndex}`}
            >
              <i className="fas fa-external-link-alt text-[10px] opacity-70" />
              {label}
            </a>
          );
        }

        return (
          <div
            key={btnIndex}
            className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
            data-testid={`dialog-button-preview-${index}-${btnIndex}`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
