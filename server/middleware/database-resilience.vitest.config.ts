/** @fileoverview Изолированный запуск HTTP-проверок устойчивости первоначальной настройки. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "server/middleware/setup-availability.test.ts",
      "server/routes/setup/setupHandlers.test.ts",
    ],
  },
});
