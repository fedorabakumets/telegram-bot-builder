/**
 * @fileoverview Анализ и массовое переключение кнопочной навигации сценария
 * @module lib/bot-tools/scenario-navigation
 */

import type { BotDataWithSheets, Node } from '@shared/schema';
import { collectAllNodes } from './collect-nodes.ts';
import { collectProjectNodeReferences, type NodeReference } from './node-references.ts';

/** Эффект нажатия кнопки */
export type ButtonEffect = 'send_new' | 'edit_current' | 'edit_keyboard' | 'external' | 'missing_target' | 'other';

/** Строка отчёта по кнопке */
export interface ButtonNavigationItem {
  /** ID ноды с кнопкой */
  sourceId: string;
  /** ID листа источника */
  sheetId: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: string;
  /** Тип клавиатуры */
  keyboardType: string;
  /** ID цели */
  targetId?: string;
  /** Тип целевой ноды */
  targetType?: string;
  /** Эффект нажатия */
  effect: ButtonEffect;
}

/** Результат анализа кнопок */
export interface ButtonNavigationReport {
  /** Всего кнопок */
  total: number;
  /** Сколько кнопок отправляют новое сообщение */
  sendsNew: number;
  /** Сколько кнопок редактируют текущее сообщение */
  editsCurrent: number;
  /** Сколько кнопок меняют только клавиатуру */
  editsKeyboard: number;
  /** Сколько кнопок выполняют внешнее действие */
  external: number;
  /** Сколько кнопок имеют отсутствующую цель */
  missingTargets: number;
  /** Подробности по кнопкам */
  buttons: ButtonNavigationItem[];
}

/** Одно запланированное изменение */
export interface NavigationRewriteChange {
  /** ID исходной message-ноды */
  nodeId: string;
  /** ID листа */
  sheetId: string;
  /** Вид изменения */
  action: 'convert_in_place' | 'create_edit_copy' | 'restore_message' | 'remove_edit_copy';
  /** ID созданной или удаляемой копии */
  editNodeId?: string;
  /** Число перенаправляемых кнопок */
  redirectedButtons: number;
}

/** Пропущенная нода */
export interface NavigationRewriteSkip {
  /** ID ноды */
  nodeId: string;
  /** Причина пропуска */
  reason: string;
}

/** План массовой правки */
export interface NavigationRewritePlan {
  /** Режим преобразования */
  mode: 'edit_current' | 'send_new';
  /** Число изменений */
  changed: number;
  /** Число перенаправленных кнопок */
  redirectedButtons: number;
  /** Запланированные изменения */
  changes: NavigationRewriteChange[];
  /** Пропущенные ноды */
  skipped: NavigationRewriteSkip[];
}

/** Результат построения плана вместе с проектом для записи */
export interface NavigationRewriteResult {
  /** План для ответа пользователю */
  plan: NavigationRewritePlan;
  /** Изменённая копия project.json */
  project: BotDataWithSheets;
}

/** Метаданные обратимого преобразования */
interface RewriteMarker {
  /** Версия формата метки */
  version: 1;
  /** Способ преобразования */
  kind: 'in_place' | 'copy';
  /** ID исходной message-ноды для копии */
  originalNodeId?: string;
}

/** Действия без перехода к ноде */
const EXTERNAL_ACTIONS = new Set(['url', 'web_app', 'copy_text', 'contact', 'location', 'pay', 'request_managed_bot']);

/** Типы нод, которые отправляют новое сообщение или медиа */
const SEND_NEW_NODE_TYPES = new Set([
  'message', 'media', 'photo', 'video', 'audio', 'document', 'sticker',
  'animation', 'location', 'contact', 'forward_message',
]);

/**
 * Вычисляет эффект кнопки.
 * @param action - Действие кнопки
 * @param keyboardType - Тип клавиатуры
 * @param target - Целевая нода
 * @returns Эффект нажатия
 */
function buttonEffect(action: string, keyboardType: string, target?: Node): ButtonEffect {
  if (EXTERNAL_ACTIONS.has(action)) return 'external';
  if (!target) return 'missing_target';
  if (SEND_NEW_NODE_TYPES.has(target.type)) return 'send_new';
  if (target.type === 'edit_message') return 'edit_current';
  if (target.type === 'keyboard') return 'edit_keyboard';
  return 'other';
}

/**
 * Строит отчёт по кнопкам проекта.
 * @param project - Данные project.json
 * @param sheetId - Необязательный фильтр листа источника
 * @returns Отчёт по эффектам кнопок
 */
export function reportButtonNavigation(project: Record<string, unknown>, sheetId?: string): ButtonNavigationReport {
  const all = collectAllNodes(project);
  const nodeMap = new Map(all.map(({ node }) => [node.id, node]));
  const buttons: ButtonNavigationItem[] = [];
  for (const { node, sheetId: sourceSheetId } of all) {
    if (sheetId && sourceSheetId !== sheetId) continue;
    const data = (node.data ?? {}) as Record<string, any>;
    const keyboardType = typeof data.keyboardType === 'string' ? data.keyboardType : (node.type === 'keyboard' ? 'inline' : 'none');
    const groups = [
      { items: data.buttons, type: keyboardType },
      ...(Array.isArray(data.conditionalMessages)
        ? data.conditionalMessages.map((condition: Record<string, any>) => ({
          items: condition.buttons,
          type: condition.keyboardType ?? 'none',
        }))
        : []),
      { items: data.responseOptions, type: data.inputButtonType ?? 'inline' },
    ];
    for (const group of groups) {
      if (!Array.isArray(group.items)) continue;
      for (const button of group.items) {
        const action = typeof button?.action === 'string' ? button.action : 'goto';
        const targetId = typeof button?.target === 'string' && button.target ? button.target : undefined;
        const target = targetId ? nodeMap.get(targetId) : undefined;
        buttons.push({
          sourceId: node.id,
          sheetId: sourceSheetId,
          text: typeof button?.text === 'string' ? button.text : '',
          action,
          keyboardType: group.type,
          targetId,
          targetType: target?.type,
          effect: buttonEffect(action, group.type, target),
        });
      }
    }
  }
  return {
    total: buttons.length,
    sendsNew: buttons.filter((item) => item.effect === 'send_new').length,
    editsCurrent: buttons.filter((item) => item.effect === 'edit_current').length,
    editsKeyboard: buttons.filter((item) => item.effect === 'edit_keyboard').length,
    external: buttons.filter((item) => item.effect === 'external').length,
    missingTargets: buttons.filter((item) => item.effect === 'missing_target').length,
    buttons,
  };
}

/**
 * Возвращает входящие ссылки на ноду.
 * @param project - Данные project.json
 * @param nodeId - ID целевой ноды
 * @returns Сведения о цели и входящие ссылки
 */
export function findInboundReferences(project: Record<string, unknown>, nodeId: string): {
  targetFound: boolean;
  targetType?: string;
  total: number;
  references: NodeReference[];
} {
  const target = collectAllNodes(project).find(({ node }) => node.id === nodeId)?.node;
  const references = collectProjectNodeReferences(project).filter((reference) => reference.targetId === nodeId);
  return { targetFound: Boolean(target), targetType: target?.type, total: references.length, references };
}

/**
 * Проверяет, является ли кнопочная ссылка inline-переходом.
 * @param reference - Ссылка из графа
 * @param sourceMap - Ноды по ID
 * @returns Признак inline-кнопки
 */
function isInlineButton(reference: NodeReference, sourceMap: Map<string, Node>): boolean {
  if (!reference.isButton) return false;
  const source = sourceMap.get(reference.sourceId);
  const data = (source?.data ?? {}) as Record<string, any>;
  const conditionalMatch = reference.path.match(/^conditionalMessages\[(\d+)]/);
  const conditionalType = conditionalMatch
    ? data.conditionalMessages?.[Number(conditionalMatch[1])]?.keyboardType
    : undefined;
  const keyboardType = conditionalType ?? data.keyboardType ?? (source?.type === 'keyboard' ? 'inline' : 'none');
  return keyboardType === 'inline';
}

/**
 * Создаёт данные edit_message из message.
 * @param data - Данные message-ноды
 * @param marker - Метка обратимого преобразования
 * @returns Данные edit_message
 */
function toEditData(data: Record<string, any>, marker: RewriteMarker): Record<string, any> {
  const keyboardNodeId = data.keyboardNodeId;
  return {
    ...data,
    editMode: keyboardNodeId ? 'both' : 'text',
    editMessageText: typeof data.messageText === 'string' ? data.messageText : '',
    editFormatMode: data.formatMode ?? (data.markdown ? 'markdown' : 'none'),
    editMessageIdSource: 'last_bot_message',
    editMessageIdManual: '',
    editKeyboardMode: keyboardNodeId ? 'node' : 'keep',
    editKeyboardNodeId: keyboardNodeId ?? '',
    _buttonNavigationRewrite: marker,
  };
}

/**
 * Создаёт уникальный ID копии edit_message.
 * @param sourceId - ID исходной ноды
 * @param occupied - Уже занятые ID
 * @returns Уникальный ID
 */
function makeEditNodeId(sourceId: string, occupied: Set<string>): string {
  const base = `${sourceId}_button_edit`;
  let candidate = base;
  let suffix = 2;
  while (occupied.has(candidate)) candidate = `${base}_${suffix++}`;
  occupied.add(candidate);
  return candidate;
}

/**
 * Перенаправляет кнопки с одной цели на другую.
 * @param project - Изменяемая копия проекта
 * @param fromId - Старый ID цели
 * @param toId - Новый ID цели
 * @returns Число изменённых кнопок
 */
function redirectButtons(project: BotDataWithSheets, fromId: string, toId: string): number {
  let count = 0;
  for (const { node } of collectAllNodes(project as unknown as Record<string, unknown>)) {
    const data = (node.data ?? {}) as Record<string, any>;
    if (Array.isArray(data.buttons) && data.keyboardType !== 'reply') {
      for (const button of data.buttons) {
        if (button?.target !== fromId) continue;
        button.target = toId;
        count++;
      }
    }
    if (!Array.isArray(data.conditionalMessages)) continue;
    for (const condition of data.conditionalMessages) {
      if (condition?.keyboardType === 'reply' || !Array.isArray(condition?.buttons)) continue;
      for (const button of condition.buttons) {
        if (button?.target !== fromId) continue;
        button.target = toId;
        count++;
      }
    }
  }
  return count;
}

/**
 * Строит и применяет к копии проекта массовую правку кнопочной навигации.
 * @param projectInput - Исходный project.json
 * @param mode - Режим: редактирование текущего либо новые сообщения
 * @param sheetId - Необязательный фильтр листа целевых экранов
 * @returns План и изменённая копия проекта
 */
export function rewriteButtonNavigation(
  projectInput: BotDataWithSheets,
  mode: 'edit_current' | 'send_new',
  sheetId?: string,
): NavigationRewriteResult {
  const project = structuredClone(projectInput);
  const all = collectAllNodes(project as unknown as Record<string, unknown>);
  const sourceMap = new Map(all.map(({ node }) => [node.id, node]));
  const sheetByNode = new Map(all.map(({ node, sheetId: nodeSheetId }) => [node.id, nodeSheetId]));
  const occupied = new Set(all.map(({ node }) => node.id));
  const references = collectProjectNodeReferences(project as unknown as Record<string, unknown>);
  const changes: NavigationRewriteChange[] = [];
  const skipped: NavigationRewriteSkip[] = [];

  if (mode === 'edit_current') {
    const skippedIds = new Set<string>();
    for (const reference of references) {
      if (!isInlineButton(reference, sourceMap)) continue;
      const target = sourceMap.get(reference.targetId);
      if (!target || target.type === 'message' || target.type === 'edit_message' || target.type === 'keyboard') continue;
      if (sheetId && sheetByNode.get(target.id) !== sheetId) continue;
      if (!SEND_NEW_NODE_TYPES.has(target.type) || skippedIds.has(target.id)) continue;
      skippedIds.add(target.id);
      skipped.push({ nodeId: target.id, reason: `unsupported_target_type:${target.type}` });
    }
    for (const { node, sheetId: targetSheetId } of all) {
      if (node.type !== 'message' || (sheetId && targetSheetId !== sheetId)) continue;
      const incoming = references.filter((reference) => reference.targetId === node.id);
      const inlineButtons = incoming.filter((reference) => isInlineButton(reference, sourceMap));
      if (!inlineButtons.length) continue;
      const data = (node.data ?? {}) as Record<string, any>;
      if (data.keyboardType === 'reply') {
        skipped.push({ nodeId: node.id, reason: 'reply_keyboard' });
        continue;
      }
      if (Array.isArray(data.buttons) && data.buttons.length && !data.keyboardNodeId) {
        skipped.push({ nodeId: node.id, reason: 'inline_buttons_without_keyboard_node' });
        continue;
      }
      const navigationIncoming = incoming.filter((reference) =>
        !['keyboardNodeId', 'editKeyboardNodeId', 'sourceMessageNodeId'].includes(reference.path),
      );
      const hasNonButtonEntry = navigationIncoming.some((reference) => !isInlineButton(reference, sourceMap));
      if (!hasNonButtonEntry) {
        node.type = 'edit_message';
        node.data = toEditData(data, { version: 1, kind: 'in_place' }) as Node['data'];
        changes.push({ nodeId: node.id, sheetId: targetSheetId, action: 'convert_in_place', redirectedButtons: 0 });
        continue;
      }
      const editNodeId = makeEditNodeId(node.id, occupied);
      const editNode = {
        ...structuredClone(node),
        id: editNodeId,
        type: 'edit_message' as const,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        data: toEditData(data, { version: 1, kind: 'copy', originalNodeId: node.id }),
      } as Node;
      const sheet = project.sheets?.find((item) => item.id === targetSheetId);
      sheet?.nodes.push(editNode);
      const redirectedButtons = redirectButtons(project, node.id, editNodeId);
      changes.push({ nodeId: node.id, sheetId: targetSheetId, action: 'create_edit_copy', editNodeId, redirectedButtons });
    }
  } else {
    for (const { node, sheetId: targetSheetId } of all) {
      if (node.type !== 'edit_message' || (sheetId && targetSheetId !== sheetId)) continue;
      const marker = (node.data as any)?._buttonNavigationRewrite as RewriteMarker | undefined;
      if (!marker || marker.version !== 1) continue;
      if (marker.kind === 'copy' && marker.originalNodeId) {
        const nonButtonIncoming = references.some((reference) =>
          reference.targetId === node.id
          && !isInlineButton(reference, sourceMap)
          && !['keyboardNodeId', 'editKeyboardNodeId', 'sourceMessageNodeId'].includes(reference.path),
        );
        if (nonButtonIncoming) {
          skipped.push({ nodeId: node.id, reason: 'edit_copy_has_non_button_references' });
          continue;
        }
        const redirectedButtons = redirectButtons(project, node.id, marker.originalNodeId);
        const sheet = project.sheets?.find((item) => item.id === targetSheetId);
        if (sheet) sheet.nodes = sheet.nodes.filter((item) => item.id !== node.id);
        changes.push({
          nodeId: marker.originalNodeId,
          sheetId: targetSheetId,
          action: 'remove_edit_copy',
          editNodeId: node.id,
          redirectedButtons,
        });
      } else {
        const data = { ...(node.data as any) };
        delete data._buttonNavigationRewrite;
        node.type = 'message';
        node.data = data;
        changes.push({ nodeId: node.id, sheetId: targetSheetId, action: 'restore_message', redirectedButtons: 0 });
      }
    }
  }

  return {
    project,
    plan: {
      mode,
      changed: changes.length,
      redirectedButtons: changes.reduce((sum, change) => sum + change.redirectedButtons, 0),
      changes,
      skipped,
    },
  };
}
