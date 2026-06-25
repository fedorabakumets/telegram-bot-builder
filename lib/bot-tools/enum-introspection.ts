/**
 * @fileoverview Интроспекция zod-схемы: извлечение допустимых значений enum-полей
 * @module lib/bot-tools/enum-introspection
 *
 * Назначение: рекурсивно обойти zod-схему data ноды и построить плоскую карту
 * "путь к полю → массив допустимых строковых значений" для всех ZodEnum.
 * Используется MCP-тулом get_node_schema, чтобы ИИ-агент подбирал валидные
 * значения enum-полей (`buttons[].action`, `assignments[].mode` и т.п.) с первого раза.
 */

/** Имена обёрток zod, которые нужно разворачивать до «ядра» через ._def.innerType */
const WRAPPER_TYPE_NAMES = new Set(['ZodOptional', 'ZodNullable', 'ZodDefault']);

/**
 * Безопасно читает discriminator zod-узла (._def.typeName)
 * @param schema - Произвольный zod-узел (тип неизвестен)
 * @returns Имя типа zod-узла или undefined
 */
function getTypeName(schema: unknown): string | undefined {
  return (schema as any)?._def?.typeName;
}

/**
 * Разворачивает обёртки zod (Optional/Nullable/Default) и Effects до внутренней схемы
 * @param schema - Произвольный zod-узел
 * @returns «Ядро» схемы без внешних обёрток
 */
function unwrapSchema(schema: unknown): unknown {
  let current = schema;
  // Разворачиваем вложенные обёртки в цикле (например, .default().optional())
  for (let guard = 0; guard < 16; guard++) {
    const typeName = getTypeName(current);
    if (typeName && WRAPPER_TYPE_NAMES.has(typeName)) {
      current = (current as any)._def?.innerType;
      continue;
    }
    // ZodEffects (z.preprocess / z.refine) — внутренняя схема лежит в ._def.schema
    if (typeName === 'ZodEffects') {
      current = (current as any)._def?.schema;
      continue;
    }
    break;
  }
  return current;
}

/**
 * Рекурсивно извлекает допустимые значения enum-полей из zod-схемы
 * @param schema - zod-схема (узел любого типа)
 * @param prefix - Текущий путь к полю (пустая строка для корня)
 * @param depth - Текущая глубина рекурсии (защита от бесконечного обхода)
 * @returns Плоская карта "путь → массив enum-значений"
 */
export function extractEnumFields(
  schema: unknown,
  prefix = '',
  depth = 0,
): Record<string, string[]> {
  // Защита от неожиданно глубоких/циклических схем
  if (depth > 8) {
    return {};
  }

  const core = unwrapSchema(schema);
  const typeName = getTypeName(core);
  if (!typeName) {
    return {};
  }

  // ZodEnum → массив допустимых значений в .options
  if (typeName === 'ZodEnum') {
    const options = (core as any)?.options;
    if (prefix && Array.isArray(options)) {
      return { [prefix]: [...options] };
    }
    return {};
  }

  // ZodObject → рекурсивно по каждому полю .shape
  if (typeName === 'ZodObject') {
    const shape = (core as any)?.shape;
    if (!shape || typeof shape !== 'object') {
      return {};
    }
    const results: Record<string, string[]>[] = [];
    for (const [key, child] of Object.entries(shape)) {
      // На корневом уровне data не добавляем префикс "data." — ключи как есть
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      results.push(extractEnumFields(child, childPrefix, depth + 1));
    }
    return Object.assign({}, ...results);
  }

  // ZodArray → рекурсивно по типу элемента с суффиксом "[]"
  if (typeName === 'ZodArray') {
    const element = (core as any)?.element ?? (core as any)?._def?.type;
    return extractEnumFields(element, `${prefix}[]`, depth + 1);
  }

  // Прочие типы (string/number/boolean/record/…) — enum-значений не содержат
  return {};
}
