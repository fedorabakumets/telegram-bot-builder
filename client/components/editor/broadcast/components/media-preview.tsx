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
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
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
}

/**
 * Отображает один медиафайл: изображение или иконку с именем/типом.
 * Поддерживает обычные URL и JSON file_id записи.
 * @param props - Свойства компонента
 * @returns JSX элемент превью
 */
export function MediaPreviewItem({ urlOrFileId }: MediaPreviewItemProps) {
  // JSON file_id запись: {"__type":"file_id","mediaType":"...","fileIdsByToken":{...}}
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
        className="max-h-20 object-cover rounded"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
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
}

/**
 * Отображает список медиафайлов рассылки.
 * Рендерит секцию только если массив непустой.
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function MediaPreviewList({ mediaUrls }: MediaPreviewListProps) {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  return (
    <div className="px-4 py-2.5">
      <p className="text-muted-foreground mb-2 text-sm">Медиафайлы</p>
      <div className="flex flex-wrap gap-2">
        {mediaUrls.map((url, idx) => (
          <MediaPreviewItem key={idx} urlOrFileId={url} />
        ))}
      </div>
    </div>
  );
}
