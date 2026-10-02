/**
 * @fileoverview Ручной запуск SQL-миграций (`npm run migrate`, `railway:setup`, CI).
 * При старте сервер применяет те же миграции сам (server/database/runMigrations.ts).
 */

import "dotenv/config";
import { applySqlMigrations } from "../server/database/applySqlMigrations";

applySqlMigrations().catch((error) => {
  console.error("❌ Migration error:", error);
  process.exit(1);
});
