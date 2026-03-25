/**
 * @fileoverview Общие константы и типы для отдельной клавиатурной связи
 *
 * Используется canvas-слоем, портами и логикой drag-to-connect, чтобы не
 * размазывать строковый тип `keyboard-link` по нескольким файлам.
 *
 * @module keyboard-connection
 */

/** Тип связи для отдельной ноды клавиатуры */
export const KEYBOARD_LINK_PORT_TYPE = 'keyboard-link' as const;

/** Вертикальное смещение порта клавиатуры внутри узла message */
export const MESSAGE_KEYBOARD_PORT_OFFSET_Y = 28;

/**
 * Проверяет, можно ли провести клавиатурную связь между двумя узлами.
 *
 * Разрешён только сценарий `message -> keyboard`.
 *
 * @param fromType - Тип исходного узла
 * @param toType - Тип целевого узла
 * @returns `true`, если связь разрешена
 */
export function isKeyboardConnectionAllowed(fromType: string, toType: string): boolean {
  return fromType === 'message' && toType === 'keyboard';
}

/**
 * Извлекает ID связанной клавиатуры из данных узла.
 *
 * @param data - Данные узла
 * @returns ID клавиатуры или `null`
 */
export function getKeyboardNodeId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const keyboardNodeId = (data as { keyboardNodeId?: unknown }).keyboardNodeId;
  return typeof keyboardNodeId === 'string' && keyboardNodeId.trim() ? keyboardNodeId : null;
}

/**
 * Добавляет ID клавиатуры в данные узла.
 *
 * @param data - Исходные данные узла
 * @param keyboardNodeId - ID ноды клавиатуры
 * @returns Копия данных узла с привязанной клавиатурой
 */
export function setKeyboardNodeId<T extends Record<string, unknown>>(
  data: T,
  keyboardNodeId: string,
): T & { keyboardNodeId: string } {
  return { ...data, keyboardNodeId };
}

/**
 * Удаляет ID клавиатуры из данных узла.
 *
 * @param data - Данные узла
 * @returns Копия данных без `keyboardNodeId`
 */
export function clearKeyboardNodeId<T extends Record<string, unknown>>(data: T): Omit<T, 'keyboardNodeId'>;
export function clearKeyboardNodeId(data: unknown): Record<string, unknown>;
export function clearKeyboardNodeId(data: unknown) {
  if (!data || typeof data !== 'object') return {};
  if (!('keyboardNodeId' in data)) return data;
  const { keyboardNodeId: _keyboardNodeId, ...rest } = data as Record<string, unknown> & {
    keyboardNodeId?: unknown;
  };
  return rest;
}
