/**
 * @fileoverview Компонент кнопок в сообщении бота
 * @description Отображает кнопки для сообщений бота
 */

import { BotMessageWithMedia } from '../../types';

/**
 * Пропсы компонента MessageButtons
 */
interface MessageButtonsProps {
  /** Сообщение бота */
  message: BotMessageWithMedia;
  /** Индекс сообщения */
  index: number;
}

/**
 * Компонент кнопок сообщения
 * @param props - Пропсы компонента
 * @returns JSX компонент кнопок или null
 */
export function MessageButtons({ message, index }: MessageButtonsProps): React.JSX.Element | null {
  const messageData = message.messageData as Record<string, any>;
  const buttons = messageData?.buttons;

  if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {buttons.map((button: any, btnIndex: number) => (
        <div
          key={btnIndex}
          className="inline-flex items-center px-3 py-1 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
          data-testid={`button-preview-${index}-${btnIndex}`}
        >
          {String(button?.text ?? '')}
        </div>
      ))}
    </div>
  );
}
