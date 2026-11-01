/** @fileoverview Обновление исходного поля ноды, включая кнопки отдельной клавиатуры. */
import { parseContentKey } from './content-key-parser';
/** Узел сценария в операции синхронизации контента. */
interface ContentNode {
  /** Исходный ID узла. */
  id: string;
  /** Тип узла. */
  type?: string;
  /** Поля узла. */
  data: Record<string, unknown>;
}
/** Минимальная структура сценария, необходимая для синхронизации. */
export interface ContentScenario {
  /** Листы проекта. */
  sheets: Array<{
    /** Узлы листа. */
    nodes: ContentNode[];
  }>;
}
/**
 * Меняет исходное поле без пересоздания нод и служебных идентификаторов.
 * @param scenario - Изменяемый сценарий.
 * @param key - Ключ строки контента.
 * @param type - Тип строки контента.
 * @param value - Новое значение.
 * @returns Найдено ли исходное поле.
 */
export function applyContentValue(scenario: ContentScenario, key: string, type: string, value: string): boolean {
  const nodes = scenario.sheets?.flatMap((sheet) => sheet.nodes ?? []) ?? [];
  const exact = nodes.find((node) => node.id === key);
  if (exact) { exact.data.messageText = value; return true; }
  const node = nodes.filter((item) => key.startsWith(`${item.id}.`)).sort((a, b) => b.id.length - a.id.length)[0];
  if (!node) return false;
  /** Исходный ID может содержать точки и слова, совпадающие с суффиксами полей. */
  const parsed = parseContentKey(`source${key.slice(node.id.length)}`, type);
  if (parsed.field === 'buttons') {
    const keyboard = nodes.find((item) => item.id === node.data.keyboardNodeId);
    const candidates = keyboard ? [keyboard, node] : [node];
    for (const candidate of candidates) {
      const buttons = Array.isArray(candidate.data.buttons) ? candidate.data.buttons as Record<string, unknown>[] : [];
      const button = buttons.find((item) => item.id === parsed.subId);
      if (button && parsed.subField) { button[parsed.subField] = value; return true; }
    }
    return false;
  }
  if (parsed.field === 'media') {
    const field = ['imageUrl', 'videoUrl', 'audioUrl', 'documentUrl'].find((item) => node.data[item] !== undefined) ?? 'imageUrl';
    node.data[field] = value;
  } else node.data[parsed.field] = value;
  return true;
}
