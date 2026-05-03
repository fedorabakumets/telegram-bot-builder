/**
 * @fileoverview Компонент медиафайлов сообщения
 * Отображает фото из сообщения — из локального хранилища или через Telegram CDN прокси.
 */

/**
 * Данные фото из Telegram (хранятся в messageData.photo)
 */
interface TelegramPhotoMeta {
  /** Идентификатор файла в Telegram */
  file_id?: string;
}

/**
 * Свойства медиа-контента
 */
interface MessageMediaProps {
  /** Массив сохранённых медиафайлов (из media_files в БД) */
  media?: Array<{
    /** URL медиафайла */
    url: string;
    /** Идентификатор сообщения */
    messageId?: number;
  }>;
  /** Дополнительные данные сообщения (содержит photo.file_id для входящих фото) */
  messageData?: unknown;
  /** Идентификатор проекта (для прокси-роута) */
  projectId?: number;
  /** Идентификатор токена (для прокси-роута) */
  tokenId?: number;
}

/**
 * Извлекает file_id фото из messageData если оно есть
 * @param messageData - Данные сообщения в произвольном формате
 * @returns file_id или null
 */
function extractPhotoFileId(messageData: unknown): string | null {
  if (!messageData || typeof messageData !== "object") return null;
  const data = messageData as Record<string, unknown>;
  const photo = data.photo as TelegramPhotoMeta | undefined;
  return photo?.file_id ?? null;
}

/**
 * Компонент отображения медиафайлов сообщения.
 * Приоритет: локально сохранённый файл → Telegram CDN через прокси.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function MessageMedia({ media, messageData, projectId, tokenId }: MessageMediaProps) {
  // Приоритет 1: локально сохранённые файлы из media_files
  if (Array.isArray(media) && media.length > 0) {
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
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ))}
      </div>
    );
  }

  // Приоритет 2: фото из Telegram CDN через прокси (file_id из messageData)
  const fileId = extractPhotoFileId(messageData);
  if (fileId && projectId) {
    const tokenParam = tokenId ? `&tokenId=${tokenId}` : "";
    const proxyUrl = `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(fileId)}${tokenParam}`;

    return (
      <div className="rounded-lg overflow-hidden max-w-[200px]">
        <img
          src={proxyUrl}
          alt="Photo"
          className="w-full h-auto rounded-lg"
          data-testid={`dialog-photo-tg-${fileId.slice(-8)}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return null;
}
