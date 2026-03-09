/**
 * @fileoverview Компонент текста сообщения
 * Отображает текст с правильными стилями
 */

/**
 * Свойства текста сообщения
 */
interface MessageTextProps {
  /** Текст сообщения */
  text?: string | null;
  /** Тип сообщения для стилей */
  messageType: 'bot' | 'user';
}

/**
 * Компонент текстового содержимого
 */
export function MessageText({ text, messageType }: MessageTextProps) {
  const isBot = messageType === 'bot';
  const trimmedText = text ? String(text).trimEnd() : '';

  return (
    <div className={`rounded-lg px-3 py-2 ${
        isBot
          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
          : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
      }`}>
      <p className="text-sm whitespace-pre-wrap break-words">
        {trimmedText}
      </p>
    </div>
  );
}
