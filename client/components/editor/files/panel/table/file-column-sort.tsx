/** @fileoverview Сортировка отображаемой страницы файлов через заголовки столбцов. */
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ProjectFile } from '../../hooks/use-project-files';
import type { FilesTableColumnId } from './files-table-columns';
import { getExtension } from './files-table-utils';

/** Поля, для которых доступно упорядочивание данных. */
const columns = ['previewName', 'internalId', 'extension', 'fileIds', 'size', 'uploader', 'storage', 'uploadDate'];
/** Порядок отображения выбранного столбца. */
interface FileSort {
  /** Столбец сортировки. */
  column: FilesTableColumnId;
  /** Направление: единица по возрастанию, минус единица по убыванию. */
  direction: number;
}

/**
 * Получает сопоставимое значение столбца, сохраняя пустые значения в конце.
 * @param file - Данные файла
 * @param column - Столбец
 * @returns Число, текст или отсутствие значения
 */
export function fileSortValue(file: ProjectFile, column: FilesTableColumnId): string | number | null {
  switch (column) {
    case 'previewName': return file.fileName || `Файл ${file.id}`;
    case 'internalId': return file.id;
    case 'extension': return getExtension(file.fileName, file.mediaType);
    case 'fileIds': return file.fileId || Object.values(file.fileIdsByToken ?? {})[0] || null;
    case 'size': return file.fileSize;
    case 'uploader': return file.uploadedBy ?? file.userId ?? null;
    case 'storage': return file.storageName ?? file.storageBackend ?? 'local';
    case 'uploadDate': return file.createdAt && Number.isFinite(Date.parse(file.createdAt)) ? Date.parse(file.createdAt) : null;
    default: return null;
  }
}

/**
 * Сортирует копию страницы без изменения полученного из запроса массива.
 * @param files - Файлы текущей страницы
 * @param sort - Направление и столбец
 * @returns Упорядоченные файлы
 */
export function sortFilePage(files: ProjectFile[], sort: FileSort | null): ProjectFile[] {
  if (!sort) return files;
  return [...files].sort((a, b) => {
    const left = fileSortValue(a, sort.column), right = fileSortValue(b, sort.column);
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return sort.direction * (typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'ru', { numeric: true }));
  });
}

/**
 * Подключает переключение направления и доступные кнопки заголовков.
 * @param files - Файлы страницы
 * @returns Упорядоченные файлы, состояние и содержимое заголовков
 */
export function useFileColumnSort(files: ProjectFile[]) {
  const [sort, setSort] = useState<FileSort | null>(null);
  const sorted = useMemo(() => sortFilePage(files, sort), [files, sort]);
  /** Рисует стрелку и переключает направление повторным нажатием. */
  const header = (column: FilesTableColumnId, label: string) => {
    if (!columns.includes(column)) return label;
    const active = sort?.column === column;
    const Icon = active ? (sort.direction === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
    return <button type="button" className="inline-flex items-center gap-1 rounded px-0 py-1 hover:text-foreground focus-visible:outline focus-visible:outline-1"
      title={`Сортировать на текущей странице: ${label}`} onClick={() => setSort({ column, direction: active ? -sort.direction : 1 })}>
      {label}<Icon className={`h-3 w-3 shrink-0 ${active ? '' : 'opacity-40'}`} aria-hidden="true" />
    </button>;
  };
  return { files: sorted, sort, header };
}
