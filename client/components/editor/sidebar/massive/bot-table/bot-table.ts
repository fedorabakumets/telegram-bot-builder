/**
 * @fileoverview Определение узла bot_table для палитры сайдбара
 * @module components/editor/sidebar/massive/bot-table/bot-table
 */

import { ComponentDefinition } from '@shared/schema';

/** Определение компонента узла работы с таблицами */
export const botTableNode: ComponentDefinition = {
  id: 'bot-table-node',
  name: 'Таблица',
  description: 'Чтение, запись и обновление данных в таблицах проекта',
  icon: 'fas fa-table',
  color: 'bg-amber-100 text-amber-600',
  type: 'bot_table' as any,
  defaultData: {
    /** Имя таблицы */
    tableName: '',
    /** Операция: read, insert, update, upsert, delete, count, sum, max, min */
    operation: 'read',
    /** Условия WHERE (массив: column + value) */
    where: [],
    /** Обновления (массив: column + op + value) */
    updates: [],
    /** Данные строки (объект: column + value) */
    row: {},
    /** Ключ для upsert */
    key: '',
    /** Поведение при конфликте: ignore, update, merge */
    onConflict: 'ignore',
    /** Переменная для сохранения результата */
    saveResultTo: '',
    /** Формат результата: first_row, all_rows, scalar, count */
    resultFormat: 'first_row',
    /** Колонки для возврата */
    returnColumns: [],
    /** Сортировка по колонке */
    orderBy: '',
    /** Направление сортировки */
    orderDirection: 'desc',
    /** Лимит строк */
    limit: 0,
    /** ID узла для автоперехода */
    autoTransitionTo: '',
    /** Колонка для агрегации (sum, max, min) */
    aggregateColumn: '',
    /** Смещение строк (для пагинации) */
    offset: 0,
    /** Включить автопереход */
    enableAutoTransition: false,
  },
};
