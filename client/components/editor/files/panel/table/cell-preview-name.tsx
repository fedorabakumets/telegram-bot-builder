/**
 * @fileoverview Ячейка «превью + название файла» таблицы файлов
 * (`CellPreviewName`). Объединяет миниатюру и имя в одной ячейке (Req 7.2):
 * кликабельное превью открывает лайтбокс через `onPreviewClick`. Для файлов,
 * не являющихся изображением/видео, вместо превью показывается иконка типа
 * медиа (Req 7.3). Переиспользует помощники из files-table-utils.
 * @module components/editor/files/panel/table/cell-preview-name
 */

import { FileText } from 'lucide-react';
import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';
import { MEDIA_ICONS, getPreviewUrl, shouldShowPreview } from './files-table-utils';

/** Пропсы ячейки «превью + название» */
export interface CellPreviewNameProps {
  /** Данные файла */
  file: ProjectFile;
  /** ID проекта (для проксирования превью) */
  projectId: number;
  /** Открыть лайтбокс превью (обрабатывается таблицей) */
  onPreviewClick?: () => void;
  /** Дополнительные классы для `td` (sticky/выделение строки) */
  className?: string;
}

/**
 * Ячейка с превью-миниатюрой и именем файла.
 * @param props - Свойства ячейки
 * @returns JSX элемент `<td>` со столбцом превью+имя
 */
export function CellPreviewName({ file, projectId, onPreviewClick, className }: CellPreviewNameProps) {
  /** Иконка типа медиа (fallback — документ) для не-изображений (Req 7.3) */
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  const previewUrl = getPreviewUrl(file, projectId);
  /** Показывать ли миниатюру (изображение/видео) или иконку типа */
  const showThumb = shouldShowPreview(file) && previewUrl;

  return (
    <td className={cn('p-2', className)}>
      <div className="flex items-center gap-2 min-w-[160px]">
        <button
          type="button"
          onClick={onPreviewClick}
          className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
          title="Открыть превью"
        >
          {showThumb ? (
            <img
              src={previewUrl!}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Icon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <span className="truncate max-w-[160px]" title={file.fileName ?? undefined}>{file.fileName ?? '—'}</span>
      </div>
    </td>
  );
}
