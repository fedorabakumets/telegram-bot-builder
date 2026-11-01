/** @fileoverview Превью фотографий выбранного блока с открытием на весь экран. */
import { useState } from 'react';
import type { ProjectFile } from '../hooks/use-project-files';
import type { AttachTarget, SheetInfo } from './panel-types';
import { getNodePhotoFiles } from './node-photo-files';
import { MediaThumbnail } from './table/media-thumbnail';
import { FilePreviewDialog } from './table/file-preview-dialog';

/** Свойства просмотра фотографий блока. */
interface NodePhotoGalleryProps {
  /** Текущий проект для доступа к файлам. */
  projectId: number;
  /** Выбранный блок назначения. */
  target?: AttachTarget | null;
  /** Листы с актуальным содержимым блоков. */
  sheets: SheetInfo[];
  /** Предпочитаемый токен для Telegram-фотографий. */
  tokenId?: number | null;
}

/**
 * Показывает уже прикреплённые фотографии и обновляется при изменении блока.
 * @param props - Проект, блок и листы
 * @returns Галерея фотографий либо отсутствие секции без выбранного блока
 */
export function NodePhotoGallery({ projectId, target, sheets, tokenId }: NodePhotoGalleryProps) {
  const [preview, setPreview] = useState<ProjectFile | null>(null);
  const node = target && sheets.flatMap(sheet => sheet.nodes).find(item => item.id === target.nodeId);
  if (!node) return null;
  const photos = getNodePhotoFiles(node.data, tokenId);
  return <section aria-label="Фотографии в блоке" className="space-y-2 border-t pt-3">
    <p className="text-sm font-medium text-foreground">Фотографии в блоке · {photos.length}</p>
    {photos.length ? <div className="flex flex-wrap gap-2">
      {photos.map(photo => <button key={photo.id} type="button" aria-label={`Открыть фото ${photo.id + 1} блока`} title="Открыть на весь экран"
        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => setPreview(photo)}><MediaThumbnail key={`${target?.nodeId}:${photo.url ?? photo.fileId}`} file={photo} projectId={projectId} /></button>)}
    </div> : <p className="text-sm text-muted-foreground">В этом блоке пока нет фотографий.</p>}
    <FilePreviewDialog key={`${target?.nodeId}:${preview?.id ?? 'closed'}`} file={preview} projectId={projectId} onClose={() => setPreview(null)} />
  </section>;
}
