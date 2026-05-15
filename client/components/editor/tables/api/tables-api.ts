/**
 * @fileoverview API-клиент для работы с таблицами проекта
 * @module editor/tables/api/tables-api
 */

import { apiRequest } from '@/queryClient';

/** Серверная модель таблицы */
interface ServerTable {
  /** ID таблицы */
  id: number;
  /** ID проекта */
  projectId: number;
  /** Имя таблицы */
  name: string;
  /** Дата создания */
  createdAt: string;
}

/** Серверная модель колонки */
interface ServerColumn {
  /** ID колонки */
  id: number;
  /** ID таблицы */
  tableId: number;
  /** Имя колонки */
  name: string;
  /** Позиция */
  position: number;
}

/** Серверная модель строки */
interface ServerRow {
  /** ID строки */
  id: number;
  /** ID таблицы */
  tableId: number;
  /** Индекс строки */
  rowIndex: number;
  /** Данные ячеек */
  data: Record<string, string>;
}

/** Базовый URL для таблиц проекта */
const baseUrl = (projectId: number) => `/api/projects/${projectId}/tables`;

/** Загрузить список таблиц проекта */
export const fetchTables = (projectId: number): Promise<ServerTable[]> =>
  apiRequest('GET', baseUrl(projectId));

/** Создать новую таблицу */
export const createTable = (projectId: number, name: string): Promise<ServerTable> =>
  apiRequest('POST', baseUrl(projectId), { name });

/** Переименовать таблицу */
export const renameTable = (projectId: number, tableId: number, name: string): Promise<ServerTable> =>
  apiRequest('PUT', `${baseUrl(projectId)}/${tableId}`, { name });

/** Удалить таблицу */
export const deleteTable = (projectId: number, tableId: number): Promise<{ success: true }> =>
  apiRequest('DELETE', `${baseUrl(projectId)}/${tableId}`);

/** Загрузить колонки таблицы */
export const fetchColumns = (projectId: number, tableId: number): Promise<ServerColumn[]> =>
  apiRequest('GET', `${baseUrl(projectId)}/${tableId}/columns`);

/** Создать колонку */
export const createColumn = (
  projectId: number,
  tableId: number,
  name: string,
  position: number,
): Promise<ServerColumn> =>
  apiRequest('POST', `${baseUrl(projectId)}/${tableId}/columns`, { name, position });

/** Переименовать колонку */
export const renameColumn = (
  projectId: number,
  tableId: number,
  columnId: number,
  name: string,
): Promise<ServerColumn> =>
  apiRequest('PUT', `${baseUrl(projectId)}/${tableId}/columns/${columnId}`, { name });

/** Удалить колонку */
export const deleteColumn = (
  projectId: number,
  tableId: number,
  columnId: number,
): Promise<{ success: true }> =>
  apiRequest('DELETE', `${baseUrl(projectId)}/${tableId}/columns/${columnId}`);

/** Загрузить строки таблицы */
export const fetchRows = (projectId: number, tableId: number): Promise<ServerRow[]> =>
  apiRequest('GET', `${baseUrl(projectId)}/${tableId}/rows`);

/** Создать строки (батч) */
export const createRows = (
  projectId: number,
  tableId: number,
  rows: Array<{ rowIndex: number; data: Record<string, string> }>,
): Promise<ServerRow[]> =>
  apiRequest('POST', `${baseUrl(projectId)}/${tableId}/rows`, { rows });

/** Обновить строку */
export const updateRow = (
  projectId: number,
  tableId: number,
  rowId: number,
  data: Record<string, string>,
): Promise<ServerRow> =>
  apiRequest('PUT', `${baseUrl(projectId)}/${tableId}/rows/${rowId}`, { data });

/** Удалить строку */
export const deleteRow = (
  projectId: number,
  tableId: number,
  rowId: number,
): Promise<{ success: true }> =>
  apiRequest('DELETE', `${baseUrl(projectId)}/${tableId}/rows/${rowId}`);

/** Перенумеровать строки */
export const reindexRows = (
  projectId: number,
  tableId: number,
): Promise<{ success: true }> =>
  apiRequest('POST', `${baseUrl(projectId)}/${tableId}/rows/reindex`);
