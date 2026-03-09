/**
 * @fileoverview Компонент медиа-вложений сообщения
 * @description Отображает изображения в сообщении
 */

import { BotMessageWithMedia } from '../../types';

/**
 * Пропсы компонента MessageMedia
 */
interface MessageMediaProps {
  /** Сообщение с медиа */
  message: BotMessageWithMedia;
}

/**
 * Компонент медиа-вложений
 * @param props - Пропсы компонента
 * @returns JSX компонент медиа
 */
export function MessageMedia({ message }: MessageMediaProps): React.JSX.Element | null {
  if (!message.media || !Array.isArray(message.media) || message.media.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden max-w-xs space-y-2">
      {message.media.map((m: any, idx: number) => (
        <img
          key={idx}
          src={m.url}
          alt="Photo"
          className="w-full h-auto rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ))}
    </div>
  );
}
