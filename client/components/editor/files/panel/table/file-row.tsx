/**
 * @fileoverview Полноценная строка таблицы файлов (десктоп) — `FileRow`.
 * Рендерит все 12 столбцов в порядке Req 7.1: выбор, превью+название,
 * внутренний ID, расширение, file_id по ботам, размер, сотрудник, хранилище,
 * дата загрузки, удаление, скачивание, использования в нодах. Ключевые столбцы
 * (выбор, превью+имя) закреплены слева (sticky) для горизонтального скролла
 * (Req 7.8). Презентация столбцов вынесена в cell-компоненты (задача 7.3):
 * `CellPreviewName`, `CellFileIds`, `CellUploader`, `CellStorage`, `CellUsages`.
 * @module components/editor/files/panel/table/file-row
 */

import { Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/utils/utils';
import type { ProjectFile } from '../../hooks/use-project-files';
import type { CollaboratorInfo } from '../../hooks/use-project-collaborators';
import type { SheetInfo } from '../panel-types';
import { getSizeColor, formatSize, getExtension, formatDate } from './files-table-utils';
import { getDownloadHref } from './file-download';
import {
  STICKY_COLUMN_NAME,
  STICKY_COLUMN_SELECT,
  TABLE_ROW_CLASS,
  TABLE_ROW_SELECTED_CLASS,
} from '../panel-styles';
import { CellPreviewName } from './cell-preview-name';
import { CellFileIds } from './cell-file-ids';
import { CellUploader } from './cell-uploader';
import { CellStorage } from './cell-storage';
import { CellUsages } from './cell-usages';

/** Пропсы строки таблицы файлов (соответствует FileRowProps дизайна) */
export interface FileRowProps {
  /** Данные файла */
  file: ProjectFile;
  /** ID проекта (для проксирования превью/скачивания) */
  projectId: number;
  /** Выбран ли файл */
  selected: boolean;
  /** Выбранный токен бота (приоритет file_id — Req 8.3) */
  selectedTokenId?: number | null;
  /** Переключение выбора файла */
  onToggle: () => void;
  /** Копирование file_id */
  onCopy: (fileId: string) => void;
  /** Удаление файла */
  onDelete?: (id: number) => void;
  /** Открыть лайтбокс превью (обрабатывается таблицей) */
  onPreviewClick?: () => void;
  /** Все листы (для столбца «используется в нодах») */
  allSheets?: SheetInfo[];
  /** Переход к ноде на холсте (только mode='page') */
  onGoToNode?: (nodeId: string, sheetId: string) => void;
  /** Коллабораторы (для аватара сотрудника) */
  collaborators: CollaboratorInfo[];
}

/** Sticky-классы для закреплённых столбцов при горизонтальном скролле */
const STICKY_SELECT = STICKY_COLUMN_SELECT;
const STICKY_NAME = STICKY_COLUMN_NAME;

/**
 * Строка таблицы файлов (десктоп) со всеми столбцами Req 7.1.
 * @param props - Свойства строки
 * @returns JSX элемент строки таблицы
 */
export function FileRow({
  file, projectId, selected, selectedTokenId, onToggle, onCopy, onDelete,
  onPreviewClick, allSheets, onGoToNode, collaborators,
}: FileRowProps) {
  /** Ссылка скачивания: прямой url либо прокси по file_id; null = недоступно (Req 15.4) */
  const downloadHref = getDownloadHref(file, projectId, selectedTokenId);

  return (
    <tr className={cn(TABLE_ROW_CLASS, selected && TABLE_ROW_SELECTED_CLASS)}>
      {/* 1. Выбор (закреплён) */}
      <td className={cn('p-2 text-center', STICKY_SELECT, selected && TABLE_ROW_SELECTED_CLASS)}>
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      {/* 2. Превью + название (закреплён) */}
      <CellPreviewName
        file={file}
        projectId={projectId}
        onPreviewClick={onPreviewClick}
        className={cn(STICKY_NAME, selected && TABLE_ROW_SELECTED_CLASS)}
      />
      {/* 3. Внутренний ID */}
      <td className="p-2 text-muted-foreground">{file.id}</td>
      {/* 4. Расширение */}
      <td className="p-2 text-muted-foreground text-[10px] uppercase">{getExtension(file.fileName, file.mediaType)}</td>
      {/* 5. file_id по ботам (приоритет выбранного токена) */}
      <CellFileIds file={file} selectedTokenId={selectedTokenId} onCopy={onCopy} />
      {/* 6. Размер */}
      <td className={cn('p-2 text-right font-mono', getSizeColor(file.fileSize))}>{formatSize(file.fileSize)}</td>
      {/* 7. Сотрудник (аватар коллаборатора) */}
      <CellUploader file={file} collaborators={collaborators} />
      {/* 8. Хранилище (бейдж local/S3) */}
      <CellStorage file={file} />
      {/* 9. Дата загрузки */}
      <td className="p-2 text-muted-foreground">{formatDate(file.createdAt)}</td>
      {/* 10. Удалить */}
      <td className="p-2 text-center">
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(file.id)} title="Удалить">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </td>
      {/* 11. Скачать: прямая/прокси-ссылка; для file_id-only без резолва — без битой ссылки (Req 15.4) */}
      <td className="p-2 text-center">
        {downloadHref ? (
          <a href={downloadHref} download={file.fileName ?? 'file'}>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Скачать"><Download className="h-3 w-3" /></Button>
          </a>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground/40"
            disabled
            title="Только file_id — прямое скачивание недоступно"
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
      </td>
      {/* 12. Используется в нодах (поповер + переход к ноде) */}
      <CellUsages file={file} allSheets={allSheets} onGoToNode={onGoToNode} />
    </tr>
  );
}
