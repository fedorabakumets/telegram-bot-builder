/**
 * @fileoverview Копирование JSON-файлов системных шаблонов сервера в директорию сборки.
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/** Корневая директория репозитория */
const rootDir = process.cwd();
/** Исходная директория с JSON-файлами шаблонов */
const sourceDir = resolve(rootDir, "server", "templates");
/** Целевая директория шаблонов внутри серверной сборки */
const targetDir = resolve(rootDir, "dist", "server", "templates");

if (!existsSync(sourceDir)) {
  console.log("ℹ️ Директория server/templates не найдена, копирование пропущено");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".json")) {
    continue;
  }

  cpSync(resolve(sourceDir, entry.name), resolve(targetDir, entry.name));
}

console.log("✅ Системные шаблоны скопированы в dist/server/templates");
