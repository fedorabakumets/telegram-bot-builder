/**
 * @fileoverview Компонент timestamp сообщения
 * @description Отображает время отправки сообщения
 */

import { formatDate } from '../../utils/format-date';

/**
 * Пропсы компонента MessageTimestamp
 */
interface MessageTimestampProps {
  /** Дата создания сообщения */
  createdAt: unknown;
}

/**
 * Компонент timestamp сообщения
 * @param props - Пропсы компонента
 * @returns JSX компонент timestamp или null
 */
export function MessageTimestamp({ createdAt }: MessageTimestampProps): React.JSX.Element | null {
  if (!createdAt) {
    return null;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {String(formatDate(createdAt))}
    </span>
  );
}
