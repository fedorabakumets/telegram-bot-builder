/**
 * @fileoverview Определения столбцов таблицы файлов в строгом порядке Req 7.1:
 * выбор, превью+название, внутренний ID, расширение, file_id по ботам, размер,
 * сотрудник, хранилище, дата загрузки, удаление, скачивание, использования в
 * нодах. Ключевые столбцы (выбор, превью+имя) помечены как «закреплённые»
 * (sticky) для горизонтального скролла на узких экранах (Req 7.8, 13.3).
 * @module components/editor/files/panel/table/files-table-columns
 */

/** Идентификатор столбца таблицы файлов */
export type FilesTableColumnId =
  | 'select'
  | 'previewName'
  | 'internalId'
  | 'extension'
  | 'fileIds'
  | 'size'
  | 'uploader'
  | 'storage'
  | 'uploadDate'
  | 'delete'
  | 'download'
  | 'usages';

/** Описание одного столбца таблицы */
export interface FilesTableColumn {
  /** Идентификатор столбца */
  id: FilesTableColumnId;
  /** Заголовок столбца (русский) */
  label: string;
  /** Закреплён ли столбец слева при горизонтальном скролле (Req 7.8) */
  pinned?: boolean;
  /** Класс выравнивания/ширины заголовка */
  className?: string;
}

/**
 * Полный набор столбцов в порядке, заданном Req 7.1.
 * Столбцы `select` и `previewName` закреплены слева для адаптивного скролла.
 */
export const FILES_TABLE_COLUMNS: FilesTableColumn[] = [
  { id: 'select', label: '', pinned: true, className: 'w-9 text-center' },
  { id: 'previewName', label: 'Файл', pinned: true, className: 'text-left min-w-[180px]' },
  { id: 'internalId', label: 'ID', className: 'text-left w-14' },
  { id: 'extension', label: 'Расш.', className: 'text-left w-14' },
  { id: 'fileIds', label: 'file_id', className: 'text-left min-w-[140px]' },
  { id: 'size', label: 'Размер', className: 'text-right w-20' },
  { id: 'uploader', label: 'Сотрудник', className: 'text-center w-24' },
  { id: 'storage', label: 'Хранилище', className: 'text-left w-28' },
  { id: 'uploadDate', label: 'Дата', className: 'text-left w-32' },
  { id: 'delete', label: '', className: 'w-10 text-center' },
  { id: 'download', label: '', className: 'w-10 text-center' },
  { id: 'usages', label: 'Ноды', className: 'w-12 text-center' },
];

/** Количество столбцов (для colSpan в пустом/загрузочном состоянии) */
export const FILES_TABLE_COLUMN_COUNT = FILES_TABLE_COLUMNS.length;
