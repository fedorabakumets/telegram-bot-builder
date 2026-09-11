/**
 * @fileoverview Чтение и проверка выключенных типов блоков
 * @module server/services/disabled-node-types
 */

import { MCP_ALLOWED_NODE_TYPES } from '../../lib/bot-tools/mcp-allowed-types';
import {
  formatDisabledNodeTypeMessage,
  isCoreNodeType,
} from '../../shared/disabled-node-types';
import { getSetting, setSetting } from './app-settings.service';

/** Ключ в таблице app_settings */
export const DISABLED_NODE_TYPES_KEY = 'disabled_node_types';

/** Блок проекта с выключенным типом */
export interface DisabledNodeHit {
  /** Внутреннее имя типа */
  type: string;
  /** Идентификатор блока */
  id: string;
}

/** Допустимые типы палитры */
const PALETTE_TYPES = new Set<string>(MCP_ALLOWED_NODE_TYPES);

/**
 * Разбирает JSON-список типов из строки настройки
 * @param raw - Сырое значение из БД
 * @returns Массив имён типов
 */
function parseDisabledList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

/**
 * Оставляет только известные не-ядровые типы палитры
 * @param types - Кандидаты на выключение
 * @returns Очищенный список без дублей
 */
export function sanitizeDisabledNodeTypes(types: string[]): string[] {
  const unique = new Set<string>();
  for (const type of types) {
    const trimmed = type.trim();
    if (!trimmed) continue;
    if (isCoreNodeType(trimmed)) continue;
    if (!PALETTE_TYPES.has(trimmed)) continue;
    unique.add(trimmed);
  }
  return [...unique].sort();
}

/**
 * Читает список выключенных типов из настроек приложения
 * @returns Массив внутренних имён типов
 */
export async function getDisabledNodeTypes(): Promise<string[]> {
  const raw = await getSetting(DISABLED_NODE_TYPES_KEY);
  return sanitizeDisabledNodeTypes(parseDisabledList(raw));
}

/**
 * Сохраняет список выключенных типов
 * @param types - Кандидаты на выключение
 * @returns Фактически сохранённый список
 */
export async function setDisabledNodeTypes(types: string[]): Promise<string[]> {
  const cleaned = sanitizeDisabledNodeTypes(types);
  await setSetting(DISABLED_NODE_TYPES_KEY, JSON.stringify(cleaned));
  return cleaned;
}

/**
 * Ищет в данных проекта блоки выключенных типов
 * @param projectData - Поле data проекта (sheets или legacy nodes)
 * @param disabledTypes - Список выключенных типов
 * @returns Найденные блоки
 */
export function findDisabledNodesInProject(
  projectData: unknown,
  disabledTypes: readonly string[],
): DisabledNodeHit[] {
  if (!disabledTypes.length || !projectData || typeof projectData !== 'object') {
    return [];
  }
  const disabled = new Set(disabledTypes);
  const hits: DisabledNodeHit[] = [];
  const data = projectData as Record<string, unknown>;

  const visit = (nodes: unknown) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const record = node as Record<string, unknown>;
      const type = typeof record.type === 'string' ? record.type : '';
      const id = typeof record.id === 'string' ? record.id : '';
      if (type && disabled.has(type)) {
        hits.push({ type, id: id || '(без id)' });
      }
    }
  };

  if (Array.isArray(data.sheets)) {
    for (const sheet of data.sheets) {
      if (sheet && typeof sheet === 'object') {
        visit((sheet as Record<string, unknown>).nodes);
      }
    }
  }
  visit(data.nodes);

  return hits;
}

/**
 * Текст отказа запуска бота при наличии выключенных типов
 * @param hits - Найденные блоки
 * @returns Сообщение об ошибке или null
 */
export function buildStartBlockedByDisabledTypesError(
  hits: DisabledNodeHit[],
): string | null {
  if (hits.length === 0) return null;

  const byType = new Map<string, string[]>();
  for (const hit of hits) {
    const ids = byType.get(hit.type) ?? [];
    ids.push(hit.id);
    byType.set(hit.type, ids);
  }

  return [...byType.entries()]
    .map(([type, ids]) => formatDisabledNodeTypeMessage(type, ids))
    .join('; ');
}
