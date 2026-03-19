/**
 * @fileoverview Фасад для управления листами в редакторе бота.
 * Объединяет модули миграции, CRUD-операций и управления состоянием листов
 * в единый статический класс `SheetsManager`.
 * @module client/utils/sheets/sheets-manager
 */

import { CanvasSheet, BotDataWithSheets, BotData, Node } from '@shared/schema';
import { migrateLegacyData, isNewFormat } from './sheet-migration';
import { createSheet, duplicateSheet, addSheet, deleteSheet, renameSheet, duplicateSheetInProject } from './sheet-crud';
import { setActiveSheet, updateSheetNodes, updateSheetData, updateSheetViewState, getActiveSheet, validateData, toLegacyFormat } from './sheet-state';

/**
 * Статический фасад для всех операций с листами проекта.
 * Делегирует вызовы соответствующим модулям:
 * - `sheet-migration` — миграция и проверка формата
 * - `sheet-crud` — создание, дублирование, удаление, переименование
 * - `sheet-state` — обновление состояния, валидация, конвертация
 */
export class SheetsManager {
  /**
   * Мигрирует данные бота из старого формата в новый формат с листами.
   *
   * @param legacyData - Данные бота в старом формате
   * @returns Данные бота в новом формате с листами
   */
  static migrateLegacyData(legacyData: BotData): BotDataWithSheets {
    return migrateLegacyData(legacyData);
  }

  /**
   * Проверяет, соответствуют ли данные новому формату с листами.
   *
   * @param data - Произвольные данные для проверки
   * @returns `true`, если данные являются `BotDataWithSheets`
   */
  static isNewFormat(data: any): data is BotDataWithSheets {
    return isNewFormat(data);
  }

  /**
   * Создаёт новый лист с заданным именем и узлами.
   *
   * @param name - Название листа
   * @param nodes - Массив узлов (по умолчанию пустой, будет создан стартовый узел)
   * @returns Новый объект листа `CanvasSheet`
   */
  static createSheet(name: string, nodes: Node[] = []): CanvasSheet {
    return createSheet(name, nodes);
  }

  /**
   * Создаёт копию листа с новыми ID узлов и обновлёнными ссылками.
   *
   * @param originalSheet - Исходный лист для дублирования
   * @returns Новый лист — копия исходного
   */
  static duplicateSheet(originalSheet: CanvasSheet): CanvasSheet {
    return duplicateSheet(originalSheet);
  }

  /**
   * Добавляет новый лист в проект и делает его активным.
   *
   * @param data - Текущие данные проекта
   * @param name - Название нового листа
   * @returns Обновлённые данные проекта с новым листом
   */
  static addSheet(data: BotDataWithSheets, name: string): BotDataWithSheets {
    return addSheet(data, name);
  }

  /**
   * Удаляет лист из проекта по его ID.
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа для удаления
   * @returns Обновлённые данные проекта без удалённого листа
   * @throws {Error} Если пытаемся удалить последний лист
   */
  static deleteSheet(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
    return deleteSheet(data, sheetId);
  }

  /**
   * Переименовывает лист в проекте.
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа для переименования
   * @param newName - Новое название листа
   * @returns Обновлённые данные проекта с переименованным листом
   */
  static renameSheet(data: BotDataWithSheets, sheetId: string, newName: string): BotDataWithSheets {
    return renameSheet(data, sheetId, newName);
  }

  /**
   * Дублирует лист в проекте и делает копию активной.
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа для дублирования
   * @returns Обновлённые данные проекта с добавленным дубликатом
   * @throws {Error} Если лист с указанным ID не найден
   */
  static duplicateSheetInProject(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
    return duplicateSheetInProject(data, sheetId);
  }

  /**
   * Устанавливает активный лист по его ID.
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа, который нужно сделать активным
   * @returns Обновлённые данные проекта с новым активным листом
   * @throws {Error} Если лист не найден
   */
  static setActiveSheet(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
    return setActiveSheet(data, sheetId);
  }

  /**
   * Обновляет массив узлов в указанном листе.
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа для обновления
   * @param nodes - Новый массив узлов
   * @returns Обновлённые данные проекта
   */
  static updateSheetNodes(data: BotDataWithSheets, sheetId: string, nodes: Node[]): BotDataWithSheets {
    return updateSheetNodes(data, sheetId, nodes);
  }

  /**
   * Обновляет данные (узлы) в указанном листе.
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа для обновления
   * @param nodes - Новый массив узлов
   * @returns Обновлённые данные проекта
   */
  static updateSheetData(data: BotDataWithSheets, sheetId: string, nodes: Node[]): BotDataWithSheets {
    return updateSheetData(data, sheetId, nodes);
  }

  /**
   * Обновляет состояние вида листа (зум и панорамирование).
   *
   * @param data - Текущие данные проекта
   * @param sheetId - ID листа для обновления
   * @param viewState - Новое состояние вида
   * @returns Обновлённые данные проекта
   */
  static updateSheetViewState(data: BotDataWithSheets, sheetId: string, viewState: { pan: { x: number; y: number }; zoom: number }): BotDataWithSheets {
    return updateSheetViewState(data, sheetId, viewState);
  }

  /**
   * Возвращает активный лист или первый лист, если активный не задан.
   *
   * @param data - Данные проекта
   * @returns Активный лист или `null`, если листов нет
   */
  static getActiveSheet(data: BotDataWithSheets): CanvasSheet | null {
    return getActiveSheet(data);
  }

  /**
   * Валидирует структуру данных проекта.
   *
   * @param data - Данные проекта для валидации
   * @returns Массив строк с описанием ошибок (пустой, если ошибок нет)
   */
  static validateData(data: BotDataWithSheets): string[] {
    return validateData(data);
  }

  /**
   * Конвертирует данные проекта в старый формат для обратной совместимости.
   *
   * @param data - Данные проекта в новом формате с листами
   * @returns Данные бота в старом формате `BotData`
   */
  static toLegacyFormat(data: BotDataWithSheets): BotData {
    return toLegacyFormat(data);
  }
}
