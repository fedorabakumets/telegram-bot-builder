/**
 * @fileoverview Утилита подсчёта узлов в проекте
 * Поддерживает старый и новый формат с листами
 */
import { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets-manager';

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
      const nodeCount = sheets.reduce((total: number, sheet: any) => total + (sheet.nodes?.length || 0), 0);
      console.log(`[${project.name}] Формат с листами. Листов: ${sheets.length}, Узлов: ${nodeCount}`);
      return nodeCount;
    } else {
      const data = project.data as { nodes?: any[] };
      const nodeCount = data.nodes?.length || 0;
      console.log(`[${project.name}] Старый формат. Узлов: ${nodeCount}`);
      return nodeCount;
    }
  } catch (error) {
    console.error('Ошибка подсчета узлов:', error);
    const fallbackData = project.data as any;
    if (fallbackData.nodes && Array.isArray(fallbackData.nodes)) {
      return fallbackData.nodes.length;
    }
    if (fallbackData.sheets && Array.isArray(fallbackData.sheets)) {
      return fallbackData.sheets.reduce((total: number, sheet: any) =>
        total + (sheet.nodes ? sheet.nodes.length : 0), 0);
    }
    return 0;
  }
};
