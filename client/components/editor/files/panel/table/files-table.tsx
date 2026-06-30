/**
 * @fileoverview Каркас таблицы файлов панели хранилища (`FilesTable`).
 * Оркестрация: шапка столбцов в порядке Req 7.1, множественный выбор
 * (header select-all + per-row checkbox, Req 3.1), адаптивность (Req 7.8, 13.3):
 * на десктопе — таблица с горизонтальным скроллом и закреплёнными столбцами
 * (выбор, превью+имя); на узких экранах — карточный режим. Десктопные строки
 * рендерит `FileRow` (все 12 столбцов Req 7.1); ячейки выносятся в cell-*
 * (задача 7.3). Узкий экран — `FileCardPlaceholder`. Файл — оркестрация/скелет.
 * @module components/editor/files/panel/table/files-table
 */

import { Checkbox } from '@/components/ui/checkbox';
import type { ProjectFile } from '../../hooks/use-project-files';
import type { CollaboratorInfo } from '../../hooks/use-project-collaborators';
import type { SheetInfo } from '../panel-types';
import { FILES_TABLE_COLUMNS, FILES_TABLE_COLUMN_COUNT } from './files-table-columns';
import { FileRow } from './file-row';
import { FileCardPlaceholder } from './file-card-placeholder';

/** Пропсы каркаса таблицы файлов */
export interface FilesTableProps {
  /** Массив файлов для отображения */
  files: ProjectFile[];
  /** ID проекта (для проксирования превью/скачивания) */
  projectId: number;
  /** Выбранный токен бота (приоритезация file_id — задача 7.3) */
  selectedTokenId?: number | null;
  /** Выбранные ID файлов (множественный выбор, Req 3.1) */
  selectedIds: Set<number>;
  /** Переключение выбора одного файла */
  onToggleSelect: (id: number) => void;
  /** Выбрать/снять все файлы текущей страницы */
  onSelectAll: (selectAll: boolean) => void;
  /** Копирование file_id в буфер обмена */
  onCopyFileId: (fileId: string) => void;
  /** Удаление файла */
  onDelete?: (id: number) => void;
  /** Коллабораторы (для аватара сотрудника — задача 7.3) */
  collaborators: CollaboratorInfo[];
  /** Все листы (для столбца «используется в нодах» — задача 7.3) */
  allSheets?: SheetInfo[];
  /** Переход к ноде на холсте (только mode='page') */
  onGoToNode?: (nodeId: string, sheetId: string) => void;
  /** Идёт ли загрузка списка файлов */
  isLoading?: boolean;
}

/** Заголовок «выбрать все»: отмечен, когда выбраны все файлы страницы */
function isAllSelected(files: ProjectFile[], selectedIds: Set<number>): boolean {
  return files.length > 0 && files.every((f) => selectedIds.has(f.id));
}

/**
 * Каркас таблицы файлов с адаптивным отображением.
 * @param props - Свойства таблицы
 * @returns JSX элемент таблицы (десктоп) и карточек (узкий экран)
 */
export function FilesTable(props: FilesTableProps) {
  const { files, projectId, selectedIds, onToggleSelect, onSelectAll, onCopyFileId, onDelete, collaborators, selectedTokenId, allSheets, onGoToNode, isLoading } = props;
  const allSelected = isAllSelected(files, selectedIds);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground" data-testid="files-table-loading">Загрузка…</div>;
  }
  if (files.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground" data-testid="files-table-empty">Файлы не найдены</div>;
  }

  /** Общие пропсы строки/карточки для каждого файла */
  const rowProps = (file: ProjectFile) => ({
    file, projectId, selected: selectedIds.has(file.id), selectedTokenId,
    onToggle: () => onToggleSelect(file.id), onCopy: onCopyFileId, onDelete, collaborators,
    allSheets, onGoToNode,
  });

  return (
    <div className="h-full" data-testid="files-table">
      {/* Десктоп: таблица с горизонтальным скроллом и закреплёнными столбцами (Req 7.8) */}
      <div className="hidden sm:block h-full overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-20 bg-muted/60 border-b">
            <tr>
              {FILES_TABLE_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  className={[
                    'p-2 font-medium whitespace-nowrap', col.className ?? '',
                    col.id === 'select' ? 'sticky left-0 z-30 bg-muted/60' : '',
                    col.id === 'previewName' ? 'sticky left-9 z-30 bg-muted/60' : '',
                  ].join(' ')}
                >
                  {col.id === 'select' ? (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                      data-testid="files-table-select-all"
                    />
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {files.map((file) => (
              <FileRow key={file.id} {...rowProps(file)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Узкий экран: карточный режим со скроллом (Req 7.8, 13.3) */}
      <div className="sm:hidden h-full overflow-auto p-3 space-y-2">
        {/* Выбор всех в карточном режиме */}
        <label className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <Checkbox checked={allSelected} onCheckedChange={(checked) => onSelectAll(checked as boolean)} />
          Выбрать все ({files.length})
        </label>
        {files.map((file) => (
          <FileCardPlaceholder key={file.id} {...rowProps(file)} />
        ))}
      </div>

      {/* colSpan-резерв для будущих состояний строки-заглушки */}
      <span className="hidden" aria-hidden data-column-count={FILES_TABLE_COLUMN_COUNT} />
    </div>
  );
}
