import { normalizeNodeData } from "./normalizeNodeData";

/**
 * Нормализует данные проекта, применяя нормализацию к каждому листу и его узлам
 *
 * @param projectData - Данные проекта, которые необходимо нормализовать
 * @returns Нормализованные данные проекта или исходные данные, если они не содержат sheets
 *
 * @description
 * Функция проверяет наличие свойства data.sheets в переданных данных проекта.
 * Если это свойство отсутствует, функция возвращает исходные данные без изменений.
 * В противном случае, функция проходит по всем листам (sheets) и нормализует
 * каждый узел (node) внутри них, используя функцию normalizeNodeData.
 * Результатом является новый объект с нормализованными данными.
 */
export function normalizeProjectData(projectData: any) {
  if (!projectData?.data?.sheets) return projectData;

  const normalizedSheets = projectData.data.sheets.map((sheet: any) => ({
    ...sheet,
    nodes: sheet.nodes ? sheet.nodes.map(normalizeNodeData) : []
  }));

  return {
    ...projectData,
    data: {
      ...projectData.data,
      sheets: normalizedSheets
    }
  };
}
