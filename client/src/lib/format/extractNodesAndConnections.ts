import { BotData } from "../../../../shared/schema";

// ============================================================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ БОТА
// ============================================================================
// Функция для сбора всех узлов и связей из всех листов проекта

export function extractNodesAndConnections(botData: BotData) {
  if (!botData) return { nodes: [], connections: [] };

  if ((botData as any).sheets && Array.isArray((botData as any).sheets)) {
    // Многолистовой проект - собираем узлы и связи из всех листов
    let allNodes: any[] = [];
    let allConnections: any[] = [];

    (botData as any).sheets.forEach((sheet: any) => {
      if (sheet.nodes && Array.isArray(sheet.nodes)) {
        allNodes = allNodes.concat(sheet.nodes);
      }
      if (sheet.connections && Array.isArray(sheet.connections)) {
        allConnections = allConnections.concat(sheet.connections);
      }
    });

    return { nodes: allNodes, connections: allConnections };
  } else {
    // Обычный проект
    return {
      nodes: botData.nodes || [],
      connections: botData.connections || []
    };
  }
}
