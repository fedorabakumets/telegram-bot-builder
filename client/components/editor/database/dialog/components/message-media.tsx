/**
 * @fileoverview Компонент медиафайлов сообщения
 * Отображает изображения из сообщения
 */

/**
 * Свойства медиа-контента
 */
interface MessageMediaProps {
  /** Массив медиафайлов */
  media?: Array<{
    /** URL медиафайла */
    url: string;
    /** Идентификатор сообщения */
    messageId?: number;
  }>;
}

/**
 * Компонент отображения медиафайлов
 */
export function MessageMedia({ media }: MessageMediaProps) {
  // Строгая проверка: media должен быть массивом
  if (!Array.isArray(media) || media.length === 0) return null;

  return (
    <div className="rounded-lg overflow-hidden max-w-[200px] space-y-1">
      {media.map((m, idx) => (
        <img
          key={idx}
          src={m.url}
          alt="Photo"
          className="w-full h-auto rounded-lg"
          data-testid={`dialog-photo-${m.messageId}-${idx}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ))}
    </div>
  );
}
