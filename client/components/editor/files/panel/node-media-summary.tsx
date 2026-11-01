/** @fileoverview Количество вложений и миниатюра фотографии блока в списке прикрепления. */
import { ImageIcon, Paperclip } from 'lucide-react';
import { getNodePhotoFiles } from './node-photo-files';
import { MediaThumbnail } from './table/media-thumbnail';

/**
 * Считает уникальные заданные вложения, включая одиночные поля старых блоков.
 * @param data - Настройки блока
 * @returns Количество ссылок на медиа и переменных вложений
 */
export function countNodeMedia(data: Record<string, unknown>): number {
  return new Set([...(Array.isArray(data.attachedMedia) ? data.attachedMedia : []),
    data.imageUrl, data.videoUrl, data.audioUrl, data.documentUrl]
    .filter((ref): ref is string => typeof ref === 'string' && !!ref.trim()).map(ref => ref.trim())).size;
}

/** Свойства компактной строки блока. */
interface NodeMediaSummaryProps {
  /** Настройки блока с вложениями. */
  data: Record<string, unknown>;
  /** Название блока. */
  label: string;
  /** Название листа и ID блока. */
  description: string;
  /** Проект для доступа к фотографиям. */
  projectId: number;
  /** Предпочитаемый токен Telegram. */
  tokenId?: number | null;
}

/**
 * Показывает название, число медиа и первое доступное фото без вложенных действий.
 * @param props - Содержимое блока и контекст файлов
 * @returns Содержимое пункта селектора
 */
export function NodeMediaSummary({ data, label, description, projectId, tokenId }: NodeMediaSummaryProps) {
  const count = countNodeMedia(data);
  const photo = getNodePhotoFiles(data, tokenId)[0];
  return <span className="flex min-w-0 items-center gap-3">
    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
      {photo ? <MediaThumbnail file={photo} projectId={projectId} /> : count ? <Paperclip className="h-4 w-4" /> : <ImageIcon className="h-4 w-4 opacity-50" />}
    </span>
    <span className="block min-w-0 space-y-1">
      <span className="block text-sm">{label}</span>
      <span className="block text-xs text-muted-foreground">{description}</span>
      <span className="block text-xs text-muted-foreground">Медиа: {count}</span>
    </span>
  </span>;
}
