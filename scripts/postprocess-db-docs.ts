/**
 * @fileoverview Постобработка docs/database после drizzle-docs-generator
 * @module scripts/postprocess-db-docs
 */

import fs from "fs";
import path from "path";
import { simplifyMermaidErInMarkdown } from "../lib/db-docs/simplify-mermaid-er";

/** Путь к README документации БД */
const DB_DOCS_README = path.join(process.cwd(), "docs", "database", "README.md");

/**
 * Упрощает ER-диаграмму в README.md (связи без колонок).
 * @returns void
 */
function postprocessDbDocsReadme(): void {
  if (!fs.existsSync(DB_DOCS_README)) {
    console.error("❌ Не найден docs/database/README.md — сначала выполните npm run docs:db:generate");
    process.exit(1);
  }

  const source = fs.readFileSync(DB_DOCS_README, "utf8");
  const updated = simplifyMermaidErInMarkdown(source);

  if (source === updated) {
    console.log("ℹ️ ER-диаграмма уже упрощена");
    return;
  }

  fs.writeFileSync(DB_DOCS_README, updated, "utf8");
  console.log("✅ ER-диаграмма упрощена (только связи таблиц)");
}

postprocessDbDocsReadme();
