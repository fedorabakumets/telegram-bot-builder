/**
 * @fileoverview Компонент времени сообщения
 * Отображает дату и время отправки
 */

import { formatDate } from '../utils/format-date';

/**
 * Свойства времени сообщения
 */
interface MessageTimestampProps {
  /** Дата создания сообщения */
  createdAt?: Date | string | null;
}

/**
 * Компонент отображения времени сообщения
 */
export function MessageTimestamp({ createdAt }: MessageTimestampProps) {
  if (!createdAt) return null;

  return (
    <span className="text-xs text-muted-foreground">
      {formatDate(createdAt)}
    </span>
  );
}
