/**
 * @fileoverview Утилита получения информации о листах проекта
 * Возвращает количество и названия листов
 */
import { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';

/** Результат получения информации о листах */
export interface SheetsInfo {
  /** Количество листов */
  count: number;
  /** Названия листов */
  names: string[];
}

/**
 * Получает информацию о листах проекта
 * @param project - Проект для получения информации
 * @returns Объект с количеством и названиями листов
 */
export const getSheetsInfo = (project: BotProject): SheetsInfo => {
  if (!project.data || typeof project.data !== 'object') return { count: 0, names: [] };

  try {
    if (SheetsManager.isNewFormat(project.data)) {
      const sheets = (project.data as any).sheets || [];
      const sheetsInfo = {
        count: sheets.length,
        names: sheets.map((sheet: any) => sheet.name || 'Лист без названия')
      };
      console.log(`[${project.name}] Информация о листах:`, sheetsInfo);
      return sheetsInfo;
    } else {
      console.log(`[${project.name}] Старый формат - один основной лист`);
      return { count: 1, names: ['Лист 1'] };
    }
  } catch (error) {
    console.error('Ошибка получения информации о листах:', error);
    return { count: 1, names: ['Лист 1'] };
  }
};
