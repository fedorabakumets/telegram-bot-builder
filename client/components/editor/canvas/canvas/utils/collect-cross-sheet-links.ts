/**
 * @fileoverview Утилита сбора кросс-листовых связей
 *
 * Сканирует ноды текущего листа и находит все ссылки (targets),
 * которые указывают на ноды с ДРУГИХ листов. Возвращает массив
 * связей, сгруппированных по целевому листу (SheetPortal).
 *
 * Также содержит функцию collectIncomingCrossSheetLinks для сбора
 * ВХОДЯЩИХ связей — нод с других листов, чьи targets указывают
 * на ноды текущего листа.
 *
 * @module canvas/utils/collect-cross-sheet-links
 */

import { Node } from '@/types/bot';
import { CanvasSheet } from '@shared/schema';

/**
 * Одна кросс-листовая связь от ноды на текущем листе к ноде на другом листе
 */
export interface CrossSheetLink {
  /** ID ноды-источника на текущем листе */
  sourceNodeId: string;
  /** ID целевой ноды на другом листе */
  targetNodeId: string;
  /** ID целевого листа */
  targetSheetId: string;
  /** Название целевого листа */
  targetSheetName: string;
  /** Тип связи */
  connectionType: string;
}

/**
 * Портал к целевому листу — группировка связей по одному листу
 */
export interface SheetPortal {
  /** ID целевого листа */
  sheetId: string;
  /** Название целевого листа */
  sheetName: string;
  /** Связи, ведущие на этот лист */
  links: CrossSheetLink[];
}

/**
 * Карта nodeId → sheetId/sheetName для быстрого поиска принадлежности ноды
 */
interface NodeSheetMapping {
  /** ID листа */
  sheetId: string;
  /** Название листа */
  sheetName: string;
}

/**
 * Строит карту nodeId → { sheetId, sheetName } для всех нод на ДРУГИХ листах
 *
 * @param sheets - Все листы проекта
 * @param activeSheetId - ID текущего листа (исключается из поиска)
 * @returns Map<nodeId, NodeSheetMapping>
 */
function buildOtherSheetsNodeMap(
  sheets: CanvasSheet[],
  activeSheetId: string,
): Map<string, NodeSheetMapping> {
  const map = new Map<string, NodeSheetMapping>();
  for (const sheet of sheets) {
    if (sheet.id === activeSheetId) continue;
    for (const node of sheet.nodes ?? []) {
      map.set(node.id, { sheetId: sheet.id, sheetName: sheet.name });
    }
  }
  return map;
}

/**
 * Проверяет target и добавляет кросс-связь если цель на другом листе
 */
function tryAddLink(
  links: CrossSheetLink[],
  sourceNodeId: string,
  targetId: string | undefined | null,
  connectionType: string,
  currentSheetNodeIds: Set<string>,
  otherNodesMap: Map<string, NodeSheetMapping>,
): void {
  if (!targetId) return;
  if (currentSheetNodeIds.has(targetId)) return;
  const mapping = otherNodesMap.get(targetId);
  if (!mapping) return;
  links.push({
    sourceNodeId,
    targetNodeId: targetId,
    targetSheetId: mapping.sheetId,
    targetSheetName: mapping.sheetName,
    connectionType,
  });
}

/**
 * Собирает все кросс-листовые связи для текущего листа
 *
 * @param currentNodes - Ноды текущего листа
 * @param sheets - Все листы проекта
 * @param activeSheetId - ID текущего листа
 * @returns Массив порталов, сгруппированных по целевому листу
 */
export function collectCrossSheetLinks(
  currentNodes: Node[],
  sheets: CanvasSheet[],
  activeSheetId: string,
): SheetPortal[] {
  const currentNodeIds = new Set(currentNodes.map(n => n.id));
  const otherNodesMap = buildOtherSheetsNodeMap(sheets, activeSheetId);
  const links: CrossSheetLink[] = [];

  for (const node of currentNodes) {
    const data = node.data as any;
    const type = node.type as string;

    // 1. Автопереход (исключаем loop и триггеры — у них своя обработка)
    const isTrigger = [
      'command_trigger', 'text_trigger', 'incoming_message_trigger',
      'group_message_trigger', 'callback_trigger', 'incoming_callback_trigger',
      'outgoing_message_trigger', 'managed_bot_updated_trigger',
      'schedule_trigger', 'userbot_edit_trigger',
    ].includes(type);

    if (data?.enableAutoTransition && data?.autoTransitionTo && type !== 'loop' && !isTrigger) {
      tryAddLink(links, node.id, data.autoTransitionTo, 'auto-transition', currentNodeIds, otherNodesMap);
    }

    // 2. Кнопки с action === 'goto'
    const buttons: any[] = data?.buttons || [];
    for (const btn of buttons) {
      if (btn.action === 'goto' && btn.target) {
        tryAddLink(links, node.id, btn.target, 'button-goto', currentNodeIds, otherNodesMap);
      }
    }

    // 3. Ветки condition
    if (type === 'condition') {
      const branches: any[] = data?.branches || [];
      for (const branch of branches) {
        tryAddLink(links, node.id, branch.target, 'condition-source', currentNodeIds, otherNodesMap);
      }
    }

    // 4. Ветки parallel_split
    if (type === 'parallel_split') {
      const parallelBranches: any[] = data?.parallelBranches || [];
      for (const branch of parallelBranches) {
        tryAddLink(links, node.id, branch.target, 'button-goto', currentNodeIds, otherNodesMap);
      }
    }

    // 5. Input target
    if (type === 'input') {
      const inputTarget = data?.inputTargetNodeId || data?.autoTransitionTo;
      tryAddLink(links, node.id, inputTarget, 'input-target', currentNodeIds, otherNodesMap);
    }

    // 6. Loop: afterLoopTo и autoTransitionTo
    if (type === 'loop') {
      tryAddLink(links, node.id, data?.afterLoopTo, 'auto-transition', currentNodeIds, otherNodesMap);
      tryAddLink(links, node.id, data?.autoTransitionTo, 'auto-transition', currentNodeIds, otherNodesMap);
    }

    // 7. Триггеры: autoTransitionTo
    if (isTrigger && data?.autoTransitionTo) {
      tryAddLink(links, node.id, data.autoTransitionTo, 'trigger-next', currentNodeIds, otherNodesMap);
    }
  }

  // Группировка по целевому листу
  const portalMap = new Map<string, SheetPortal>();
  for (const link of links) {
    let portal = portalMap.get(link.targetSheetId);
    if (!portal) {
      portal = { sheetId: link.targetSheetId, sheetName: link.targetSheetName, links: [] };
      portalMap.set(link.targetSheetId, portal);
    }
    portal.links.push(link);
  }

  return Array.from(portalMap.values());
}

/**
 * Собирает ВХОДЯЩИЕ кросс-листовые связи для текущего листа.
 *
 * Сканирует ноды ВСЕХ ДРУГИХ листов и находит ссылки (targets),
 * которые указывают на ноды ТЕКУЩЕГО листа. Группирует по исходному листу.
 *
 * @param currentNodes - Ноды текущего листа (для определения множества target-ов)
 * @param sheets - Все листы проекта
 * @param activeSheetId - ID текущего листа
 * @returns Массив порталов, сгруппированных по исходному листу
 */
export function collectIncomingCrossSheetLinks(
  currentNodes: Node[],
  sheets: CanvasSheet[],
  activeSheetId: string,
): SheetPortal[] {
  const currentNodeIds = new Set(currentNodes.map(n => n.id));
  const links: CrossSheetLink[] = [];

  // Проходим по каждому листу кроме активного
  for (const sheet of sheets) {
    if (sheet.id === activeSheetId) continue;
    const sheetNodes = sheet.nodes ?? [];

    for (const node of sheetNodes) {
      const data = node.data as any;
      const type = node.type as string;

      const isTrigger = [
        'command_trigger', 'text_trigger', 'incoming_message_trigger',
        'group_message_trigger', 'callback_trigger', 'incoming_callback_trigger',
        'outgoing_message_trigger', 'managed_bot_updated_trigger',
        'schedule_trigger', 'userbot_edit_trigger',
      ].includes(type);

      // 1. Автопереход
      if (data?.enableAutoTransition && data?.autoTransitionTo && type !== 'loop' && !isTrigger) {
        if (currentNodeIds.has(data.autoTransitionTo)) {
          links.push({ sourceNodeId: node.id, targetNodeId: data.autoTransitionTo, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'auto-transition' });
        }
      }

      // 2. Кнопки с action === 'goto'
      const buttons: any[] = data?.buttons || [];
      for (const btn of buttons) {
        if (btn.action === 'goto' && btn.target && currentNodeIds.has(btn.target)) {
          links.push({ sourceNodeId: node.id, targetNodeId: btn.target, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'button-goto' });
        }
      }

      // 3. Ветки condition
      if (type === 'condition') {
        for (const branch of (data?.branches || [])) {
          if (branch.target && currentNodeIds.has(branch.target)) {
            links.push({ sourceNodeId: node.id, targetNodeId: branch.target, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'condition-source' });
          }
        }
      }

      // 4. Ветки parallel_split
      if (type === 'parallel_split') {
        for (const branch of (data?.parallelBranches || [])) {
          if (branch.target && currentNodeIds.has(branch.target)) {
            links.push({ sourceNodeId: node.id, targetNodeId: branch.target, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'button-goto' });
          }
        }
      }

      // 5. Input target
      if (type === 'input') {
        const inputTarget = data?.inputTargetNodeId || data?.autoTransitionTo;
        if (inputTarget && currentNodeIds.has(inputTarget)) {
          links.push({ sourceNodeId: node.id, targetNodeId: inputTarget, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'input-target' });
        }
      }

      // 6. Loop
      if (type === 'loop') {
        if (data?.afterLoopTo && currentNodeIds.has(data.afterLoopTo)) {
          links.push({ sourceNodeId: node.id, targetNodeId: data.afterLoopTo, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'auto-transition' });
        }
        if (data?.autoTransitionTo && currentNodeIds.has(data.autoTransitionTo)) {
          links.push({ sourceNodeId: node.id, targetNodeId: data.autoTransitionTo, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'auto-transition' });
        }
      }

      // 7. Триггеры
      if (isTrigger && data?.autoTransitionTo && currentNodeIds.has(data.autoTransitionTo)) {
        links.push({ sourceNodeId: node.id, targetNodeId: data.autoTransitionTo, targetSheetId: sheet.id, targetSheetName: sheet.name, connectionType: 'trigger-next' });
      }
    }
  }

  // Группировка по ИСХОДНОМУ листу (откуда приходит связь)
  const portalMap = new Map<string, SheetPortal>();
  for (const link of links) {
    let portal = portalMap.get(link.targetSheetId);
    if (!portal) {
      portal = { sheetId: link.targetSheetId, sheetName: link.targetSheetName, links: [] };
      portalMap.set(link.targetSheetId, portal);
    }
    portal.links.push(link);
  }

  return Array.from(portalMap.values());
}
