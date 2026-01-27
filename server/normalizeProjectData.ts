import { normalizeNodeData } from "./normalizeNodeData";

// Функция нормализации данных проекта
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
