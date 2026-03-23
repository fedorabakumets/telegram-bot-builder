/**
 * @fileoverview Утилита получения информации о листах проекта
 * Возвращает количество и названия листов
 */
import { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';

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
      if (!Array.isArray(sheets)) return { count: 0, names: [] };
      const sheetsInfo = {
        count: sheets.length,
        names: sheets.map((sheet: any) => sheet.name || 'Лист без названия')
      };
      return sheetsInfo;
    } else {
      const data = project.data as { nodes?: any[] };
      if (!data.nodes || !Array.isArray(data.nodes)) {
        return { count: 0, names: [] };
      }
      return { count: 1, names: ['Лист 1'] };
    }
  } catch (error) {
    console.error('Ошибка получения информации о листах:', error);
    return { count: 0, names: [] };
  }
};
