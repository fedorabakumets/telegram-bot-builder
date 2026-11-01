/**
 * @fileoverview Ячейка «превью + название файла» таблицы файлов
 * (`CellPreviewName`). Объединяет миниатюру и имя в одной ячейке (Req 7.2):
 * кликабельное превью открывает лайтбокс через `onPreviewClick`. Для файлов,
 * не являющихся изображением/видео, вместо превью показывается иконка типа
 * медиа (Req 7.3). Переиспользует помощники из files-table-utils.
 * @module components/editor/files/panel/table/cell-preview-name
 */

import { MediaThumbnail } from './media-thumbnail';
import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';


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
  return (
    <td className={cn('p-2', className)}>
      <div className="flex items-center gap-2 min-w-[160px]">
        <button
          type="button"
          onClick={onPreviewClick}
          className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer"
          title="Открыть превью"
        >
          <MediaThumbnail file={file} projectId={projectId} />
        </button>
        <span className="truncate max-w-[160px]" title={file.fileName ?? undefined}>{file.fileName ?? '—'}</span>
      </div>
    </td>
  );
}
