/**
 * @fileoverview Доп. блоки markdown для параметров и примеров OpenAPI.
 * @module lib/api-docs/render-operation-details
 */

/** Параметр OpenAPI path/query/header */
export interface OpenApiParamLike {
  /** Имя */
  name?: string;
  /** path | query | header | cookie */
  in?: string;
  /** Описание */
  description?: string;
  /** Обязательность */
  required?: boolean;
  /** Пример на параметре */
  example?: unknown;
  /** Схема с example */
  schema?: { example?: unknown; type?: string };
}

/** content["application/json"] фрагмент */
interface JsonContentLike {
  /** Схема или $ref */
  schema?: unknown;
  /** Один example */
  example?: unknown;
  /** Несколько examples */
  examples?: Record<string, { summary?: string; value?: unknown }>;
}

/**
 * Извлекает имя схемы из $ref.
 * @param schema - JSON Schema фрагмент
 * @returns Имя схемы или null
 */
export function schemaRefName(schema: unknown): string | null {
  if (!schema || typeof schema !== "object" || !("$ref" in schema)) return null;
  const ref = (schema as { $ref: string }).$ref;
  return ref.split("/").pop() ?? null;
}

/**
 * Рендерит таблицу параметров path/query.
 * @param parameters - Массив parameters операции
 * @returns Строки markdown (без завершающего пустого)
 */
export function renderParametersTable(parameters: unknown[] | undefined): string[] {
  if (!parameters?.length) return [];

  const lines = [
    "",
    "#### Параметры",
    "",
    "| Имя | In | Обязательный | Описание | Пример |",
    "|-----|-----|--------------|----------|--------|",
  ];

  for (const raw of parameters) {
    const p = raw as OpenApiParamLike;
    const example = p.example ?? p.schema?.example;
    const exampleStr =
      example === undefined ? "—" : `\`${JSON.stringify(example).replace(/\|/g, "\\|")}\``;
    lines.push(
      `| \`${p.name ?? "?"}\` | ${p.in ?? "—"} | ${p.required ? "да" : "нет"} | ${p.description ?? "—"} | ${exampleStr} |`,
    );
  }

  return lines;
}

/**
 * Рендерит блок примера JSON тела запроса.
 * @param jsonContent - content application/json requestBody
 * @returns Строки markdown
 */
export function renderRequestExample(jsonContent: JsonContentLike | undefined): string[] {
  if (!jsonContent) return [];
  const value = pickExampleValue(jsonContent);
  if (value === undefined) return [];

  return [
    "",
    "#### Пример тела запроса",
    "",
    "```json",
    JSON.stringify(value, null, 2),
    "```",
  ];
}

/**
 * Рендерит пример успешного JSON-ответа (первый 2xx с example).
 * @param responses - responses операции
 * @returns Строки markdown
 */
export function renderResponseExample(
  responses: Record<string, { content?: Record<string, JsonContentLike> }> | undefined,
): string[] {
  if (!responses) return [];

  for (const code of Object.keys(responses).sort()) {
    if (!/^2\d\d$/.test(code)) continue;
    const json = responses[code]?.content?.["application/json"];
    const value = pickExampleValue(json);
    if (value === undefined) continue;
    return [
      "",
      `#### Пример ответа \`${code}\``,
      "",
      "```json",
      JSON.stringify(value, null, 2),
      "```",
    ];
  }

  return [];
}

/**
 * Берёт example или первый examples.*.value.
 * @param content - JSON content
 * @returns Значение или undefined
 */
function pickExampleValue(content: JsonContentLike | undefined): unknown {
  if (!content) return undefined;
  if (content.example !== undefined) return content.example;
  const entries = content.examples ? Object.values(content.examples) : [];
  return entries[0]?.value;
}
