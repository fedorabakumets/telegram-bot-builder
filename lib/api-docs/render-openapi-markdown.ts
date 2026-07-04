/**
 * @fileoverview Генерация Markdown-документации API из OpenAPI spec
 * @module lib/api-docs/render-openapi-markdown
 */

import fs from "fs";
import path from "path";

/** HTTP-методы OpenAPI */
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

/** Описание одной операции OpenAPI */
interface OpenApiOperation {
  /** Теги группировки */
  tags?: string[];
  /** Краткое описание */
  summary?: string;
  /** Подробное описание */
  description?: string;
  /** Переопределение security (пустой массив = публичный) */
  security?: Record<string, string[]>[];
  /** Query/path параметры */
  parameters?: unknown[];
  /** Тело запроса */
  requestBody?: { content?: Record<string, { schema?: unknown }> };
  /** Ответы по кодам */
  responses?: Record<string, { description?: string; content?: unknown }>;
}

/** OpenAPI document (минимальная типизация для рендера) */
export interface OpenApiDocForMarkdown {
  /** Метаданные API */
  info: { title: string; description?: string; version: string };
  /** Эндпоинты */
  paths: Record<string, Record<string, OpenApiOperation>>;
  /** Глобальная авторизация по умолчанию */
  security?: Record<string, string[]>[];
}

/** Операция с путём и методом для сортировки */
interface TaggedOperation {
  /** Тег OpenAPI */
  tag: string;
  /** HTTP-метод */
  method: string;
  /** Путь */
  path: string;
  /** Операция */
  operation: OpenApiOperation;
}

/**
 * Извлекает имя схемы из $ref.
 * @param schema - JSON Schema фрагмент
 * @returns Имя схемы или null
 */
function schemaRefName(schema: unknown): string | null {
  if (!schema || typeof schema !== "object" || !("$ref" in schema)) return null;
  const ref = (schema as { $ref: string }).$ref;
  return ref.split("/").pop() ?? null;
}

/**
 * Форматирует блок авторизации операции.
 * @param operation - Операция OpenAPI
 * @param defaultSecurity - Глобальный security spec
 * @returns Строка для markdown
 */
function formatAuth(operation: OpenApiOperation, defaultSecurity?: Record<string, string[]>[]): string {
  const sec = operation.security ?? defaultSecurity;
  if (Array.isArray(sec) && sec.length === 0) return "Публичный";
  if (!sec?.length) return "Cookie (`connect.sid`) или Bearer PAT";
  const keys = sec.flatMap((s) => Object.keys(s));
  const parts: string[] = [];
  if (keys.includes("cookieAuth")) parts.push("Cookie (`connect.sid`)");
  if (keys.includes("agentToken")) parts.push("Bearer PAT");
  return parts.join(" или ") || "Cookie / Bearer PAT";
}

/**
 * Рендерит одну операцию в markdown.
 * @param method - HTTP-метод
 * @param path - URL
 * @param operation - Операция OpenAPI
 * @param defaultSecurity - Глобальный security
 * @returns Markdown-фрагмент
 */
function renderOperation(
  method: string,
  path: string,
  operation: OpenApiOperation,
  defaultSecurity?: Record<string, string[]>[],
): string {
  const title = operation.summary ?? `${method.toUpperCase()} ${path}`;
  const lines = [
    `### \`${method.toUpperCase()}\` ${path}`,
    "",
    title,
    "",
    `**Авторизация:** ${formatAuth(operation, defaultSecurity)}`,
  ];

  if (operation.description) {
    lines.push("", operation.description);
  }

  const jsonBody = operation.requestBody?.content?.["application/json"]?.schema;
  const bodySchema = schemaRefName(jsonBody);
  if (bodySchema) {
    lines.push("", `**Тело запроса:** \`${bodySchema}\``);
  }

  const paramCount = operation.parameters?.length ?? 0;
  if (paramCount > 0) {
    lines.push("", `**Параметры:** ${paramCount}`);
  }

  if (operation.responses && Object.keys(operation.responses).length > 0) {
    lines.push("", "#### Ответы", "", "| Код | Описание |", "|-----|----------|");
    for (const [code, resp] of Object.entries(operation.responses).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`| ${code} | ${resp.description ?? "—"} |`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Собирает операции, сгруппированные по тегу.
 * @param doc - OpenAPI document
 * @returns Map tag → операции
 */
function collectByTag(doc: OpenApiDocForMarkdown): Map<string, TaggedOperation[]> {
  const byTag = new Map<string, TaggedOperation[]>();

  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = methods[method];
      if (!operation) continue;
      const tag = operation.tags?.[0] ?? "other";
      const list = byTag.get(tag) ?? [];
      list.push({ tag, method, path, operation });
      byTag.set(tag, list);
    }
  }

  for (const list of byTag.values()) {
    list.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  }

  return byTag;
}

/**
 * Записывает docs/api/README.md и docs/api/{tag}.md.
 * @param doc - OpenAPI document
 * @param outputDir - Каталог docs/api
 * @returns void
 */
export function renderOpenApiMarkdownFiles(doc: OpenApiDocForMarkdown, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const byTag = collectByTag(doc);
  const sortedTags = [...byTag.keys()].sort((a, b) => a.localeCompare(b));

  const indexRows = sortedTags.map((tag) => {
    const count = byTag.get(tag)?.length ?? 0;
    return `| [${tag}](./${tag}.md) | ${count} |`;
  });

  const index = [
    `# ${doc.info.title} — API Reference`,
    "",
    doc.info.description ?? "",
    "",
    `**Версия OpenAPI:** ${doc.info.version}`,
    "",
    "> Сгенерировано из OpenAPI spec (`npm run docs:api`). Интерактивная документация: `/admin/docs`.",
    "",
    "## Разделы",
    "",
    "| Тег | Эндпоинтов |",
    "|-----|------------|",
    ...indexRows,
    "",
    "## Авторизация",
    "",
    "- **Cookie** — сессия после Telegram Login Widget (`connect.sid`)",
    "- **Bearer PAT** — персональный токен агента (MCP/CLI)",
    "- Публичные эндпоинты помечены «Публичный»",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(outputDir, "README.md"), index, "utf8");

  for (const tag of sortedTags) {
    const ops = byTag.get(tag) ?? [];
    const body = [
      `# ${tag}`,
      "",
      `Эндпоинтов: **${ops.length}**`,
      "",
      ...ops.map((o) => renderOperation(o.method, o.path, o.operation, doc.security)),
    ].join("\n");
    fs.writeFileSync(path.join(outputDir, `${tag}.md`), body, "utf8");
  }
}
