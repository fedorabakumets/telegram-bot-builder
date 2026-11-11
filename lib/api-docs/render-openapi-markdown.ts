/**
 * @fileoverview Генерация Markdown-документации API из OpenAPI spec
 * @module lib/api-docs/render-openapi-markdown
 */

import fs from "fs";
import path from "path";
import { writeGeneratedFile } from '../../tools/mcp-catalog/write-file';
import {
  renderParametersTable,
  renderRequestExample,
  renderResponseExample,
  schemaRefName,
} from "./render-operation-details";

/** HTTP-методы OpenAPI */
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

/** Описание одной операции OpenAPI */
interface OpenApiOperation {
  /** Стабильное имя операции для клиентов OpenAPI. */
  operationId?: string;
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
  requestBody?: {
    content?: Record<string, { schema?: unknown; example?: unknown; examples?: unknown }>;
  };
  /** Ответы по кодам */
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: unknown; example?: unknown; examples?: unknown }>;
    }
  >;
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
  if (keys.includes("adminCookie")) parts.push("Admin cookie");
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
  if (operation.operationId) lines.push('', `**Operation ID:** \`${operation.operationId}\``);

  const jsonBody = operation.requestBody?.content?.["application/json"];
  const bodySchema = schemaRefName(jsonBody?.schema);
  if (bodySchema) {
    lines.push("", `**Тело запроса:** \`${bodySchema}\``);
  }

  lines.push(...renderParametersTable(operation.parameters));
  lines.push(...renderRequestExample(jsonBody));

  if (operation.responses && Object.keys(operation.responses).length > 0) {
    lines.push("", "#### Ответы", "", "| Код | Описание |", "|-----|----------|");
    for (const [code, resp] of Object.entries(operation.responses).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      lines.push(`| ${code} | ${resp.description ?? "—"} |`);
    }
  }

  lines.push(...renderResponseExample(operation.responses));
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
 * Удаляет markdown-файлы тегов, которых нет в текущем OpenAPI spec.
 * @param outputDir - Каталог docs/api
 * @param activeTags - Актуальные имена тегов
 * @returns Список удалённых файлов
 */
function removeStaleTagMarkdownFiles(outputDir: string, activeTags: Set<string>): string[] {
  const removed: string[] = [];

  for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;

    const tag = entry.name.slice(0, -".md".length);
    if (activeTags.has(tag)) continue;

    fs.unlinkSync(path.join(outputDir, entry.name));
    removed.push(entry.name);
  }

  return removed;
}

/**
 * Записывает docs/api/README.md и docs/api/{tag}.md.
 * @param doc - OpenAPI document
 * @param outputDir - Каталог docs/api
 * @returns Имена удалённых устаревших markdown-файлов тегов
 */
export async function renderOpenApiMarkdownFiles(doc: OpenApiDocForMarkdown, outputDir: string): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });
  const byTag = collectByTag(doc);
  /** Порядок кодовых точек одинаков в Windows и Linux при генерации документации. */
  const sortedTags = [...byTag.keys()].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const activeTagSet = new Set(sortedTags);

  const indexRows = sortedTags.map((tag) => {
    const count = byTag.get(tag)?.length ?? 0;
    return `| [${tag}](./${tag}.md) | ${count} |`;
  });
  /** Число HTTP-операций без повторов при нескольких тегах одной операции. */
  const operationCount = Object.values(doc.paths).reduce((count, methods) => count + Object.keys(methods).filter(method => HTTP_METHODS.includes(method as typeof HTTP_METHODS[number])).length, 0);

  const index = [
    `# ${doc.info.title} — API Reference`,
    "",
    doc.info.description ?? "",
    "",
    `**Версия OpenAPI:** ${doc.info.version}`,
    "",
    "> Сгенерировано из OpenAPI spec (`npm run docs:api`). Интерактивная документация: `/admin/docs`.",
    "",
    `В снимке ${operationCount} HTTP-операций. Число маршрутов HTTP не равно числу действий основного MCP.`,
    "",
    "## Сборка и границы покрытия",
    "",
    "`npm run docs:api` (или `npx tsx scripts/generate-api-docs.ts`) собирает контракты из реестра без запуска Express, фоновых задач, Redis и БД. Проверка зависимостей в `lib/api-docs/offline-document.test.ts` запрещает импорт исполняемых маршрутов и модулей хранилища.",
    "",
    "[Отчёт покрытия](./offline-coverage.json) содержит неразрешённые ссылки, дубли ID, ответы без схем, намеренно пустые ответы и статические кандидаты маршрутов. Старые runtime-only записи сохраняются с `x-offline-unverified` до описания. Пустой missingCandidates означает покрытие разрешённых AST-литералов, а не доказательство работы всех маршрутов: динамические выражения, условные регистрации и Router mounts требуют отдельной проверки в изолированном приложении.",
    "",
    "Основной MCP использует общий реестр действий и полный либо компактный профиль с четырьмя инструментами. [Альтернативный OpenAPI-адаптер](../../tools/mcp-openapi/README.md) публикует только пять проверенных GET-действий чтения и статусов. Он не открывает все API, секреты или управление собственными ключами. Для обновления его подмножества: `node tools/mcp-openapi/prepare-spec.mjs`; старый generated-клиент после изменения политики нужно пересобрать отдельно.",
    "",
    "## Повторяемые записи таблиц",
    "",
    "Создание таблицы/столбца/строк, импорт строк/таблиц, apply-ops и cells/edit принимают необязательный UUID requestId. Без него действует прежний формат: объект дополнен persistence, массив остаётся массивом и подтверждается JSON-заголовком x-botcraft-persistence. С UUID ответ содержит state:completed, receipt.ids (до 500), idsTruncated и доступное persistence. Повтор UUID с прежними аргументами возвращает квитанцию, с другими — 409. Ответ 202 со state:unknown и retryable:false требует сверки, а не автоматического повтора. Подтверждение БД не означает доставку live-события или применение изменений работающим ботом.",
    "",
    "## Разделы",
    "",
    "| Тег | Эндпоинтов |",
    "|-----|------------|",
    ...indexRows,
    "",
    "## Авторизация",
    "",
    "- **Cookie** — сессия после Telegram Login / Mini App / dev-login (`connect.sid`)",
    "- **Bearer PAT** — персональный токен агента (MCP/CLI)",
    "- **Admin cookie** — `/admin/login` (`ADMIN_API_KEY`)",
    "- Публичные эндпоинты помечены «Публичный»",
    "",
  ].join("\n");

  await writeGeneratedFile(path.join(outputDir, 'README.md'), index);

  for (const tag of sortedTags) {
    const ops = byTag.get(tag) ?? [];
    const body = [
      `# ${tag}`,
      "",
      `Эндпоинтов: **${ops.length}**`,
      "",
      ...ops.map((o) => renderOperation(o.method, o.path, o.operation, doc.security)),
    ].join("\n");
    await writeGeneratedFile(path.join(outputDir, `${tag}.md`), body);
  }

  return removeStaleTagMarkdownFiles(outputDir, activeTagSet);
}
