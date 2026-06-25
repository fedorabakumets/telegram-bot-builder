/**
 * @fileoverview Мутации project.json: scaffold, add, connect, remove
 * @module lib/bot-tools/project-mutate
 */

import { nanoid } from 'nanoid';
import type { BotDataWithSheets, Node } from '@shared/schema';
import { collectAllNodes } from './collect-nodes.ts';
import { minimizeNode } from './minimize-node-data.ts';
import { validateBotProject } from './validate-project.ts';
import type { ValidateProjectResult } from './types.ts';

/** Результат мутации проекта */
export interface MutateProjectResult {
  /** Обновлённый проект */
  project: BotDataWithSheets;
  /** Валидация после мутации */
  validation: ValidateProjectResult;
}

/** Тип порта соединения (упрощённый порт canvas) */
export type ConnectPortType = 'auto-transition' | 'trigger-next' | 'button-goto' | 'input-target';

/**
 * Парсит project_json в объект
 * @param input - Объект или JSON-строка
 * @returns project или null
 */
function parseProject(input: unknown): BotDataWithSheets | null {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input) as BotDataWithSheets;
    } catch {
      return null;
    }
  }
  if (input && typeof input === 'object') return structuredClone(input) as BotDataWithSheets;
  return null;
}

/**
 * Находит индекс листа по id или возвращает активный/первый
 * @param project - Проект
 * @param sheetId - ID листа
 * @returns Индекс листа
 */
function resolveSheetIndex(project: BotDataWithSheets, sheetId?: string): number {
  const sheets = project.sheets ?? [];
  if (sheetId) {
    const idx = sheets.findIndex((s) => s.id === sheetId);
    if (idx >= 0) return idx;
  }
  if (project.activeSheetId) {
    const idx = sheets.findIndex((s) => s.id === project.activeSheetId);
    if (idx >= 0) return idx;
  }
  return 0;
}

/**
 * Создаёт минимальный project.json со стартовой парой command_trigger + message
 * @param nodes - Опциональный список нод (иначе дефолтный scaffold)
 * @param sheetName - Имя листа
 * @returns project + validation
 */
export function scaffoldMinimalProject(nodes?: Node[], sheetName = 'Лист 1'): MutateProjectResult {
  const sheetId = nanoid();
  const defaultNodes: Node[] = (nodes ?? [
    {
      id: 'start-message',
      type: 'message',
      position: { x: 400, y: 300 },
      data: { messageText: 'Привет! Я ваш новый бот.' },
    },
    {
      id: 'start-command-trigger',
      type: 'command_trigger',
      position: { x: 100, y: 300 },
      data: {
        command: '/start',
        description: 'Запустить бота',
        showInMenu: true,
        autoTransitionTo: 'start-message',
        sourceNodeId: 'start-message',
      },
    },
  ] as Node[]).map((n) => minimizeNode(n));

  const project: BotDataWithSheets = {
    version: 2,
    activeSheetId: sheetId,
    sheets: [{
      id: sheetId,
      name: sheetName,
      nodes: defaultNodes,
      viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
    }],
  };

  return { project, validation: validateBotProject(project) };
}

/**
 * Добавляет ноду на лист проекта
 * @param projectJson - Текущий project.json
 * @param node - Нода для добавления
 * @param sheetId - ID листа
 */
export function addNodeToProject(projectJson: unknown, node: Node, sheetId?: string): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const idx = resolveSheetIndex(project, sheetId);
  const sheets = [...(project.sheets ?? [])];
  const sheet = { ...sheets[idx], nodes: [...(sheets[idx]?.nodes ?? []), minimizeNode(node)] };
  sheets[idx] = sheet;

  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Обновляет ноду по id (shallow merge data)
 * @param projectJson - project.json
 * @param nodeId - ID ноды
 * @param patch - Частичное обновление ноды
 * @param sheetId - ID листа
 */
export function updateNodeInProject(
  projectJson: unknown,
  nodeId: string,
  patch: { type?: Node['type']; position?: Node['position']; data?: Partial<Node['data']> },
  sheetId?: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const idx = resolveSheetIndex(project, sheetId);
  const sheets = [...(project.sheets ?? [])];
  const nodes = (sheets[idx]?.nodes ?? []).map((n) => {
    if (n.id !== nodeId) return n;
    return {
      ...n,
      ...(patch.type ? { type: patch.type } : {}),
      ...(patch.position ? { position: patch.position } : {}),
      ...(patch.data ? { data: { ...n.data, ...patch.data } } : {}),
    };
  });
  sheets[idx] = { ...sheets[idx], nodes };

  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Удаляет ноду из проекта
 * @param projectJson - project.json
 * @param nodeId - ID ноды
 * @param sheetId - ID листа
 */
export function removeNodeFromProject(
  projectJson: unknown,
  nodeId: string,
  sheetId?: string,
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const idx = resolveSheetIndex(project, sheetId);
  const sheets = [...(project.sheets ?? [])];
  sheets[idx] = {
    ...sheets[idx],
    nodes: (sheets[idx]?.nodes ?? []).filter((n) => n.id !== nodeId),
  };

  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Соединяет две ноды (auto-transition, button/branch target, input-target)
 * @param projectJson - project.json
 * @param fromId - ID исходной ноды
 * @param toId - ID целевой ноды
 * @param options - branch id, portType, sheetId
 */
export function connectNodes(
  projectJson: unknown,
  fromId: string,
  toId: string,
  options: { branch?: string; portType?: ConnectPortType; sheetId?: string } = {},
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const allIds = new Set(collectAllNodes(project as Record<string, unknown>).map((e) => e.node.id));
  if (!allIds.has(fromId) || !allIds.has(toId)) {
    return { error: `Нода не найдена: from=${fromId} to=${toId}` };
  }

  const portType = options.portType ?? 'auto-transition';
  const branchId = options.branch;
  const idx = resolveSheetIndex(project, options.sheetId);
  const sheets = [...(project.sheets ?? [])];

  const nodes = (sheets[idx]?.nodes ?? []).map((n) => {
    if (n.id !== fromId) return n;
    const data = { ...n.data } as Record<string, unknown>;

    if (portType === 'trigger-next' || portType === 'auto-transition') {
      data.autoTransitionTo = toId;
      if (portType === 'auto-transition') data.enableAutoTransition = true;
      return { ...n, data: data as Node['data'] };
    }

    if (portType === 'button-goto' && branchId) {
      if (Array.isArray(data.buttons)) {
        data.buttons = data.buttons.map((btn) =>
          btn.id === branchId ? { ...btn, target: toId } : btn,
        );
      }
      if (Array.isArray(data.branches)) {
        data.branches = data.branches.map((b) =>
          b.id === branchId ? { ...b, target: toId } : b,
        );
      }
      if (Array.isArray(data.parallelBranches)) {
        data.parallelBranches = data.parallelBranches.map((b) =>
          b.id === branchId ? { ...b, target: toId } : b,
        );
      }
      return { ...n, data: data as Node['data'] };
    }

    if (portType === 'input-target') {
      data.inputTargetNodeId = toId;
      return { ...n, data: data as Node['data'] };
    }

    data.autoTransitionTo = toId;
    data.enableAutoTransition = true;
    return { ...n, data: data as Node['data'] };
  });

  sheets[idx] = { ...sheets[idx], nodes };
  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Снимает переход(ы) между нодами (зеркало connectNodes).
 * Без options.branch снимает ВСЕ рёбра fromId→toId по всем полям data
 * (autoTransitionTo + enableAutoTransition, inputTargetNodeId, keyboardNodeId,
 * target у элементов buttons/branches/parallelBranches). С options.branch
 * снимает только target у элемента с этим id.
 * @param projectJson - project.json (объект или JSON-строка)
 * @param fromId - ID исходной ноды
 * @param toId - ID целевой ноды
 * @param options - branch id (снять только указанную кнопку/ветку), portType, sheetId
 * @returns project + validation или { error }
 */
export function disconnectNodes(
  projectJson: unknown,
  fromId: string,
  toId: string,
  options: { branch?: string; portType?: ConnectPortType; sheetId?: string } = {},
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const allIds = new Set(collectAllNodes(project as Record<string, unknown>).map((e) => e.node.id));
  if (!allIds.has(fromId)) {
    return { error: `Нода не найдена: from=${fromId}` };
  }

  const branchId = options.branch;
  const idx = resolveSheetIndex(project, options.sheetId);
  const sheets = [...(project.sheets ?? [])];

  let changed = false;

  const nodes = (sheets[idx]?.nodes ?? []).map((n) => {
    if (n.id !== fromId) return n;
    const data = { ...n.data } as Record<string, unknown>;

    if (branchId) {
      // Снять target только у элемента с заданным id в buttons/branches/parallelBranches
      for (const key of ['buttons', 'branches', 'parallelBranches'] as const) {
        const arr = data[key];
        if (Array.isArray(arr)) {
          data[key] = arr.map((el) => {
            const item = el as Record<string, unknown>;
            if (item.id === branchId && item.target === toId) {
              changed = true;
              return { ...item, target: undefined };
            }
            return el;
          }) as never;
        }
      }
      return { ...n, data: data as Node['data'] };
    }

    // Снять ВСЕ рёбра fromId→toId по всем полям
    if (data.autoTransitionTo === toId) {
      delete data.autoTransitionTo;
      delete data.enableAutoTransition;
      changed = true;
    }
    if (data.inputTargetNodeId === toId) {
      delete data.inputTargetNodeId;
      changed = true;
    }
    if (data.keyboardNodeId === toId) {
      delete data.keyboardNodeId;
      changed = true;
    }
    for (const key of ['buttons', 'branches', 'parallelBranches'] as const) {
      const arr = data[key];
      if (Array.isArray(arr)) {
        data[key] = arr.map((el) => {
          const item = el as Record<string, unknown>;
          if (item.target === toId) {
            changed = true;
            return { ...item, target: undefined };
          }
          return el;
        }) as never;
      }
    }

    return { ...n, data: data as Node['data'] };
  });

  if (!changed) {
    return { error: `Связь не найдена: from=${fromId} to=${toId}${branchId ? ' branch=' + branchId : ''}` };
  }

  sheets[idx] = { ...sheets[idx], nodes };
  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated) };
}

/**
 * Генерирует новый уникальный id ноды на основе существующего: срезает прежние
 * суффиксы копирования (_copy_/_paste_) и добавляет свежий _copy_<ts>_<rand>.
 * Портирован из клиентского generateNewId, без внешних зависимостей.
 * @param id - Исходный id ноды
 * @returns Новый уникальный id
 */
function generateDuplicateNodeId(id: string): string {
  const baseId = id.replace(/(_paste_\d+_[a-z0-9]+|_copy_\d+_[a-z0-9]+|_copy_\d+)+$/, '');
  return `${baseId}_copy_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Дублирует одну ноду на том же листе: глубокая копия с новым id и смещённой
 * позицией. Исходящие ссылки копии (target/autoTransitionTo/inputTargetNodeId/
 * keyboardNodeId) НАМЕРЕННО сохраняются как у оригинала — копия ведёт к тем же
 * downstream-нодам (зеркало клиентского duplicateNode для одиночного узла).
 * branch.id внутри копии не ремаппятся: они уникальны лишь в рамках ноды, а нода новая.
 * @param projectJson - project.json (объект или JSON-строка)
 * @param nodeId - ID дублируемой ноды
 * @param options - position (позиция копии, иначе смещение +40/+40), sheetId
 * @returns project + validation + newNodeId или { error }
 */
export function duplicateNodeInProject(
  projectJson: unknown,
  nodeId: string,
  options?: { position?: { x: number; y: number }; sheetId?: string },
): (MutateProjectResult & { newNodeId: string }) | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const idx = resolveSheetIndex(project, options?.sheetId);
  const sheets = [...(project.sheets ?? [])];
  const source = (sheets[idx]?.nodes ?? []).find((n) => n.id === nodeId);
  if (!source) return { error: `Нода не найдена: ${nodeId}` };

  const newId = generateDuplicateNodeId(nodeId);
  const clone = structuredClone(source) as Node;
  clone.id = newId;
  clone.position = options?.position ?? {
    x: (source.position?.x ?? 0) + 40,
    y: (source.position?.y ?? 0) + 40,
  };

  sheets[idx] = { ...sheets[idx], nodes: [...(sheets[idx]?.nodes ?? []), clone] };
  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated), newNodeId: newId };
}

/**
 * Переносит ноду на другой лист проекта, сохраняя id, data и все ссылки.
 * Ссылки (target'ы) НЕ ремаппятся: id ноды сохраняется, поэтому связи остаются
 * валидными глобально. Аналог клиентского useMoveNodeToSheet, но иммутабельно.
 * @param projectJson - Текущий project.json (объект или JSON-строка)
 * @param nodeId - ID переносимой ноды
 * @param toSheetId - ID целевого листа
 * @param options - Опции: fromSheetId (исходный лист, иначе автопоиск), position (новая позиция на целевом листе)
 * @returns project + validation или { error }
 */
export function moveNodeToProjectSheet(
  projectJson: unknown,
  nodeId: string,
  toSheetId: string,
  options?: { fromSheetId?: string; position?: { x: number; y: number } },
): MutateProjectResult | { error: string } {
  const project = parseProject(projectJson);
  if (!project) return { error: 'Невалидный project_json' };

  const sheets = [...(project.sheets ?? [])];

  // Проверка существования целевого листа
  const toIdx = sheets.findIndex((s) => s.id === toSheetId);
  if (toIdx < 0) return { error: 'Целевой лист не найден' };

  // Определение исходного листа: явный fromSheetId или автопоиск по nodeId
  let fromIdx: number;
  if (options?.fromSheetId) {
    fromIdx = sheets.findIndex((s) => s.id === options.fromSheetId);
    if (fromIdx < 0) return { error: 'Исходный лист не найден' };
    if (!(sheets[fromIdx]?.nodes ?? []).some((n) => n.id === nodeId)) {
      return { error: 'Нода не найдена' };
    }
  } else {
    fromIdx = sheets.findIndex((s) => (s.nodes ?? []).some((n) => n.id === nodeId));
    if (fromIdx < 0) return { error: 'Нода не найдена' };
  }

  // Guard: нода уже на целевом листе — бессмысленный no-op-PUT не делаем
  if (sheets[fromIdx]?.id === toSheetId) return { error: 'Нода уже на этом листе' };

  // Извлечение объекта ноды из исходного листа
  const sourceNode = (sheets[fromIdx]?.nodes ?? []).find((n) => n.id === nodeId) as Node;
  // id, type, data — без изменений; меняется только позиция (опционально)
  const movedNode: Node = options?.position
    ? { ...sourceNode, position: options.position }
    : sourceNode;

  // Иммутабельная пересборка листов
  sheets[fromIdx] = {
    ...sheets[fromIdx],
    nodes: (sheets[fromIdx]?.nodes ?? []).filter((n) => n.id !== nodeId),
  };
  sheets[toIdx] = {
    ...sheets[toIdx],
    nodes: [...(sheets[toIdx]?.nodes ?? []), movedNode],
  };

  const updated = { ...project, sheets };
  return { project: updated, validation: validateBotProject(updated) };
}
