/** @fileoverview Кандидаты структурных примеров JSON Schema, проверяемые исходным Zod перед публикацией. */

/** Строит кандидат без исполнения действия. @param input - Схема SDK. @returns Структурный пример. */
export function schemaExample(input: unknown): unknown {
  if (!input || typeof input !== 'object') return undefined;
  const schema = input as Record<string, any>;
  if ('default' in schema) return schema.default;
  if ('const' in schema) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf || schema.oneOf) return schemaExample((schema.anyOf ?? schema.oneOf)[0]);
  if (schema.type === 'object') {
    const required = new Set<string>(schema.required ?? []);
    return Object.fromEntries(Object.entries(schema.properties ?? {}).filter(([name]) => required.has(name))
      .map(([name, value]) => [name, schemaExample(value)]));
  }
  if (schema.type === 'array') return Array.from({ length: schema.minItems ?? 0 }, () => schemaExample(schema.items));
  if (schema.type === 'integer' || schema.type === 'number') return Math.max(schema.minimum ?? 1, typeof schema.exclusiveMinimum === 'number' ? schema.exclusiveMinimum + 1 : 1);
  if (schema.type === 'boolean') return false;
  if (schema.type === 'null') return null;
  if (schema.type === 'string') {
    const formats: Record<string, string> = { date: '2026-01-01', 'date-time': '2026-01-01T00:00:00Z', uuid: '11111111-1111-4111-8111-111111111111', uri: 'https://example.com', email: 'example@example.com' };
    if (formats[schema.format]) return formats[schema.format];
    return ['1', 'example', '/start', 'https://example.com', '2026-01-01', 'x'.repeat(Math.max(1, schema.minLength ?? 1))]
      .find(value => value.length >= (schema.minLength ?? 0) && value.length <= (schema.maxLength ?? Infinity)
        && (!schema.pattern || new RegExp(schema.pattern).test(value)));
  }
  return undefined;
}
