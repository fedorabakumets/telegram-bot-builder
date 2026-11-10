/** @fileoverview Настройки адресных тестов доступа к хранилищам. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["server/routes/setupStorageConfigRoutes.test.ts"] },
});
