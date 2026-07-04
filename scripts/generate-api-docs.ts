/**
 * @fileoverview Генерация docs/api из OpenAPI spec (Express + Zod registry)
 * @module scripts/generate-api-docs
 */

import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { renderOpenApiMarkdownFiles } from "../lib/api-docs/render-openapi-markdown";
import { registerRoutes } from "../server/routes/routes";
import { buildOpenApiDocument } from "../server/swagger/setup-swagger";

dotenv.config({ debug: false });

/** Каталог выходных файлов */
const API_DOCS_DIR = path.join(process.cwd(), "docs", "api");

/**
 * Собирает OpenAPI spec и записывает openapi.json + markdown.
 * @returns void
 */
async function generateApiDocs(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL не задан — нужен для registerRoutes при сборке spec");
    process.exit(1);
  }

  console.log("📄 Сбор OpenAPI spec из Express-маршрутов...");
  const app = express();
  app.use(express.json());

  await registerRoutes(app);
  const document = buildOpenApiDocument(app);

  fs.mkdirSync(API_DOCS_DIR, { recursive: true });
  fs.writeFileSync(path.join(API_DOCS_DIR, "openapi.json"), JSON.stringify(document, null, 2), "utf8");
  console.log("✅ Записан docs/api/openapi.json");

  renderOpenApiMarkdownFiles(document, API_DOCS_DIR);
  const tagCount = fs.readdirSync(API_DOCS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md").length;
  console.log(`✅ Markdown: docs/api/README.md + ${tagCount} файлов по тегам`);
}

generateApiDocs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Ошибка генерации API docs:", err);
    process.exit(1);
  });
