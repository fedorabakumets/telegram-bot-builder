/** @fileoverview Сохранённая клавиатура рассылки в общей ленте сообщений. */
import { MessageButtons } from './message-buttons';

/** Свойства клавиатуры отправленной рассылки. */
interface BroadcastKeyboardPreviewProps {
  /** Кнопки, сохранённые вместе с рассылкой. */
  buttons: unknown;
  /** Количество кнопок в строке; ноль означает один ряд. */
  buttonsPerRow?: number | null;
  /** Идентификатор рассылки для элементов предпросмотра. */
  broadcastId: number;
}

/**
 * Показывает те же кнопки и раскладку, которые использовались при отправке.
 * @param props - Сохранённая клавиатура рассылки
 * @returns Ряды кнопок или пустое представление
 */
export function BroadcastKeyboardPreview({ buttons, buttonsPerRow, broadcastId }: BroadcastKeyboardPreviewProps) {
  if (!Array.isArray(buttons)) return null;
  const items = buttons.filter((button): button is { text?: unknown; url?: string; action?: string } =>
    button !== null && typeof button === 'object');
  if (!items.length) return null;
  const width = buttonsPerRow && buttonsPerRow > 0 ? buttonsPerRow : items.length;
  const rows = Array.from({ length: Math.ceil(items.length / width) }, (_, row) =>
    items.slice(row * width, (row + 1) * width));
  return (
    <div aria-label="Кнопки рассылки" className="space-y-1">
      {rows.map((row, index) => <MessageButtons key={index} buttons={row} index={broadcastId * 100 + index} />)}
    </div>
  );
}
