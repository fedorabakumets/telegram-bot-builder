/**
 * @fileoverview Утилита подсчёта узлов в проекте
 * Поддерживает старый и новый формат с листами
 */
import { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';

/**
 * Подсчитывает количество узлов в проекте
 * @param project - Проект для подсчёта
 * @returns Количество узлов в проекте
 */
export const getNodeCount = (project: BotProject): number => {
  if (!project.data || typeof project.data !== 'object') return 0;

  try {
    if (SheetsManager.isNewFormat(project.data)) {
      const sheets = (project.data as any).sheets || [];
      if (!Array.isArray(sheets)) return 0;
      const nodeCount = sheets.reduce((total: number, sheet: any) => {
        if (!sheet.nodes || !Array.isArray(sheet.nodes)) return total;
        return total + sheet.nodes.length;
      }, 0);
      console.log(`[${project.name}] Формат с листами. Листов: ${sheets.length}, Узлов: ${nodeCount}`);
      return nodeCount;
    } else {
      const data = project.data as { nodes?: any[] };
      if (!data.nodes || !Array.isArray(data.nodes)) return 0;
      const nodeCount = data.nodes.length;
      console.log(`[${project.name}] Старый формат. Узлов: ${nodeCount}`);
      return nodeCount;
    }
  } catch (error) {
    console.error('Ошибка подсчета узлов:', error);
    return 0;
  }
};
