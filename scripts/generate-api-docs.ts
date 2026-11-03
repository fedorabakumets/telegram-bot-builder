/**
 * @fileoverview Генерация docs/api из OpenAPI spec (Express + Zod registry)
 * @module scripts/generate-api-docs
 */

import fs from "fs";
import path from "path";
import { renderOpenApiMarkdownFiles } from "../lib/api-docs/render-openapi-markdown";
import { buildOfflineDocument } from '../lib/api-docs/build-offline-document';
import { auditDocument } from '../lib/api-docs/audit-document';
import { sourceRouteCandidates } from '../lib/api-docs/source-route-candidates';
import { writeGeneratedFile } from '../tools/mcp-catalog/write-file';
import { reviewDynamicRoutes } from '../lib/api-docs/review-dynamic-routes';

/** Каталог выходных файлов */
const API_DOCS_DIR = path.join(process.cwd(), "docs", "api");

/**
 * Собирает OpenAPI spec и записывает openapi.json + markdown.
 * @returns void
 */
async function generateApiDocs(): Promise<void> {
  console.log('Сбор явно зарегистрированных контрактов без подключения базы данных...');
  fs.mkdirSync(API_DOCS_DIR, { recursive: true });
  /** Runtime-only записи прежнего снимка сохраняются с явным признаком непроверенности. */
  const snapshot = path.join(API_DOCS_DIR, 'openapi.json');
  const previous = fs.existsSync(snapshot) ? JSON.parse(fs.readFileSync(snapshot, 'utf8')) : undefined;
  const document = buildOfflineDocument(previous);
  /** Неразрешённые ссылки или авторизация не должны попасть в новый публикуемый снимок. */
  const audit = auditDocument(document);
  if (audit.unresolvedRefs.length || audit.missingSecuritySchemes.length || audit.duplicateIds.length || audit.missingIds.length) {
    throw new Error(`Нарушены ссылки или идентификаторы OpenAPI: ${JSON.stringify(audit)}`);
  }
  const unverified = Object.entries(document.paths).flatMap(([route, methods]) =>
    Object.entries(methods).filter(([, operation]) => operation['x-offline-unverified']).map(([method]) => `${method.toUpperCase()} ${route}`));
  const candidates = sourceRouteCandidates(path.join(process.cwd(), 'server'));
  const missingCandidates = candidates.filter(candidate => candidate.resolvedPath?.startsWith('/api/')
    && !['USE', 'ALL', 'HEAD'].includes(candidate.method)
    && !document.paths[candidate.resolvedPath]?.[candidate.method.toLowerCase()]);
  await writeGeneratedFile(path.join(API_DOCS_DIR, 'offline-coverage.json'), JSON.stringify({
    description: 'Сохранённые runtime-only операции старого снимка; наличие и контракт требуют независимой проверки.',
    unverified, audit,
    sourceCandidateNotice: 'Кандидаты AST не являются доказательством runtime-покрытия. Динамические выражения и mounts требуют проверки.',
    missingCandidates, dynamicReview: reviewDynamicRoutes(candidates, document.paths), sourceCandidates: candidates,
  }, null, 2));

  fs.mkdirSync(API_DOCS_DIR, { recursive: true });
  /** Общий чистый файловый помощник использует атомарную замену и повтор временных блокировок Windows. */
  await writeGeneratedFile(snapshot, JSON.stringify(document, null, 2));
  console.log("✅ Записан docs/api/openapi.json");

  const removedStale = await renderOpenApiMarkdownFiles(document, API_DOCS_DIR);
  const tagCount = fs.readdirSync(API_DOCS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md").length;
  console.log(`✅ Markdown: docs/api/README.md + ${tagCount} файлов по тегам`);
  if (removedStale.length > 0) {
    console.log(`🗑️ Удалены устаревшие docs/api: ${removedStale.join(", ")}`);
  }
}

generateApiDocs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Ошибка генерации API docs:", err);
    process.exit(1);
  });
