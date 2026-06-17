/**
 * @fileoverview Вспомогательный компонент превью медиафайлов рассылки
 * Используется в StepConfirm и BroadcastDetail для единообразного отображения.
 */

/**
 * Проверяет, является ли URL изображением по расширению
 * @param url - URL файла
 * @returns true если файл является изображением
 */
function isImageUrl(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

/**
 * Проверяет, является ли URL видео по расширению
 * @param url - URL файла
 * @returns true если файл является видео
 */
function isVideoUrl(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  return ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
}

/**
 * Проверяет, является ли URL аудио по расширению
 * @param url - URL файла
 * @returns true если файл является аудио
 */
function isAudioUrl(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  return ['mp3', 'ogg', 'wav', 'm4a', 'aac'].includes(ext);
}

/**
 * Извлекает имя файла из URL
 * @param url - URL файла
 * @returns Имя файла или пустая строка
 */
function basename(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? url;
}

/**
 * Иконка и метка для типа медиа
 * @param type - Тип медиа
 * @returns Строка с иконкой и меткой
 */
function mediaTypeLabel(type?: string): string {
  switch (type) {
    case 'video': return '🎬 Видео';
    case 'audio': return '🎵 Аудио';
    case 'document': return '📄 Документ';
    case 'photo': return '🖼️ Фото';
    default: return '📎 Файл';
  }
}

/**
 * Пропсы компонента MediaPreviewItem
 */
interface MediaPreviewItemProps {
  /** URL или JSON file_id строка */
  urlOrFileId: string;
  /** ID проекта для прокси Telegram file_id */
  projectId?: number;
  /** ID токена для прокси Telegram file_id */
  tokenId?: number | null;
}

/**
 * Извлекает file_id и тип медиа из JSON-записи
 * @param entry - JSON-строка file_id
 * @param tokenId - Предпочтительный токен
 * @returns Метаданные file_id или null
 */
function parseFileIdEntry(entry: string, tokenId?: number | null): { mediaType?: string; fileId?: string } | null {
  if (!entry.startsWith('{"__type":"file_id"')) return null;
  try {
    const parsed = JSON.parse(entry) as { mediaType?: string; fileIdsByToken?: Record<string, string> };
    const map = parsed.fileIdsByToken ?? {};
    const preferredKey = tokenId != null ? String(tokenId) : Object.keys(map)[0];
    const fileId = map[preferredKey] ?? Object.values(map).find(Boolean);
    if (!fileId) return null;
    return { mediaType: parsed.mediaType, fileId };
  } catch {
    return null;
  }
}

/**
 * Строит URL прокси для Telegram file_id
 * @param fileId - Идентификатор файла
 * @param projectId - ID проекта
 * @param tokenId - ID токена
 * @returns URL прокси
 */
function buildProxyUrl(fileId: string, projectId: number, tokenId?: number | null): string {
  const tokenParam = tokenId ? `&tokenId=${tokenId}` : '';
  return `/api/projects/${projectId}/telegram-file?fileId=${encodeURIComponent(fileId)}${tokenParam}`;
}

/**
 * Отображает один медиафайл: изображение или иконку с именем/типом.
 * Поддерживает обычные URL и JSON file_id записи.
 * @param props - Свойства компонента
 * @returns JSX элемент превью
 */
export function MediaPreviewItem({ urlOrFileId, projectId, tokenId }: MediaPreviewItemProps) {
  const fileIdEntry = parseFileIdEntry(urlOrFileId, tokenId);

  if (fileIdEntry?.fileId && projectId) {
    const src = buildProxyUrl(fileIdEntry.fileId, projectId, tokenId);
    if (fileIdEntry.mediaType === 'video') {
      return (
        <video
          src={src}
          controls
          className="max-h-40 w-full max-w-xs rounded-lg"
          preload="metadata"
        />
      );
    }
    if (fileIdEntry.mediaType === 'audio') {
      return <audio src={src} controls className="w-full max-w-xs" preload="metadata" />;
    }
    if (fileIdEntry.mediaType === 'photo') {
      return (
        <img
          src={src}
          alt="Фото"
          className="max-h-40 object-cover rounded-lg"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-muted/40 rounded px-2 py-1">
        📎 {mediaTypeLabel(fileIdEntry.mediaType)}
      </span>
    );
  }

  if (fileIdEntry) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-muted/40 rounded px-2 py-1">
        📎 {mediaTypeLabel(fileIdEntry.mediaType)}
      </span>
    );
  }

  // JSON file_id запись без распознанного file_id
  if (urlOrFileId.startsWith('{"__type":"file_id"')) {
    try {
      const parsed = JSON.parse(urlOrFileId) as { mediaType?: string };
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-muted/40 rounded px-2 py-1">
          📎 {mediaTypeLabel(parsed.mediaType)}
        </span>
      );
    } catch {
      return <span className="text-xs text-muted-foreground">📎 Файл</span>;
    }
  }

  // Обычный URL — изображение
  if (isImageUrl(urlOrFileId)) {
    return (
      <img
        src={urlOrFileId}
        alt="Медиа"
        className="max-h-40 object-cover rounded-lg"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  if (isVideoUrl(urlOrFileId)) {
    return (
      <video
        src={urlOrFileId}
        controls
        className="max-h-40 w-full max-w-xs rounded-lg"
        preload="metadata"
      />
    );
  }

  if (isAudioUrl(urlOrFileId)) {
    return <audio src={urlOrFileId} controls className="w-full max-w-xs" preload="metadata" />;
  }

  // Остальные файлы — иконка + имя
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-muted/40 rounded px-2 py-1">
      📎 {basename(urlOrFileId)}
    </span>
  );
}

/**
 * Пропсы компонента MediaPreviewList
 */
interface MediaPreviewListProps {
  /** Массив URL или JSON file_id строк */
  mediaUrls: string[];
  /** ID проекта для прокси Telegram file_id */
  projectId?: number;
  /** ID токена для прокси Telegram file_id */
  tokenId?: number | null;
  /** Компактный режим без заголовка секции */
  compact?: boolean;
}

/**
 * Отображает список медиафайлов рассылки.
 * Рендерит секцию только если массив непустой.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function MediaPreviewList({ mediaUrls, projectId, tokenId, compact }: MediaPreviewListProps) {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'px-4 py-2.5'}>
      {!compact && <p className="text-muted-foreground mb-2 text-sm">Медиафайлы</p>}
      <div className="flex flex-wrap gap-2">
        {mediaUrls.map((url, idx) => (
          <MediaPreviewItem key={idx} urlOrFileId={url} projectId={projectId} tokenId={tokenId} />
        ))}
      </div>
    </div>
  );
}
